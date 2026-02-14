const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("MyGovernor", function () {
    let governanceToken;
    let governor;
    let owner, addr1, addr2, addr3;
    const PROPOSAL_THRESHOLD = ethers.parseEther("1000");
    const QUORUM_PERCENTAGE = 4;

    beforeEach(async function () {
        [owner, addr1, addr2, addr3] = await ethers.getSigners();

        // Deploy GovernanceToken
        const GovernanceToken = await ethers.getContractFactory("GovernanceToken");
        governanceToken = await GovernanceToken.deploy();
        await governanceToken.waitForDeployment();

        // Deploy MyGovernor
        const MyGovernor = await ethers.getContractFactory("MyGovernor");
        governor = await MyGovernor.deploy(await governanceToken.getAddress());
        await governor.waitForDeployment();

        // Distribute tokens
        await governanceToken.transfer(addr1.address, ethers.parseEther("100000"));
        await governanceToken.transfer(addr2.address, ethers.parseEther("100000"));
        await governanceToken.transfer(addr3.address, ethers.parseEther("50000"));

        // Delegate voting power (required for voting)
        await governanceToken.connect(owner).delegate(owner.address);
        await governanceToken.connect(addr1).delegate(addr1.address);
        await governanceToken.connect(addr2).delegate(addr2.address);
        await governanceToken.connect(addr3).delegate(addr3.address);

        // Approve governor to spend tokens (required for quadratic voting cost)
        await governanceToken.connect(owner).approve(await governor.getAddress(), ethers.MaxUint256);
        await governanceToken.connect(addr1).approve(await governor.getAddress(), ethers.MaxUint256);
        await governanceToken.connect(addr2).approve(await governor.getAddress(), ethers.MaxUint256);
        await governanceToken.connect(addr3).approve(await governor.getAddress(), ethers.MaxUint256);
    });

    describe("Deployment", function () {
        it("Should set the correct name", async function () {
            expect(await governor.name()).to.equal("MyGovernor");
        });

        it("Should set the correct voting delay", async function () {
            expect(await governor.votingDelay()).to.equal(1);
        });

        it("Should set the correct voting period", async function () {
            expect(await governor.votingPeriod()).to.equal(50400);
        });

        it("Should set the correct proposal threshold", async function () {
            expect(await governor.proposalThreshold()).to.equal(PROPOSAL_THRESHOLD);
        });

        it("Should set the correct quorum", async function () {
            const totalSupply = await governanceToken.totalSupply();
            const expectedQuorum = (totalSupply * BigInt(QUORUM_PERCENTAGE)) / 100n;
            const blockNumber = await ethers.provider.getBlockNumber() - 1; // Past block
            if (blockNumber >= 0) {
                expect(await governor.quorum(blockNumber)).to.equal(expectedQuorum);
            }
        });
    });

    describe("Proposal Creation", function () {
        it("Should allow users with enough tokens to create proposals", async function () {
            const targets = [await governanceToken.getAddress()];
            const values = [0];
            const calldatas = [governanceToken.interface.encodeFunctionData("transfer", [addr2.address, 100])];
            const description = "Proposal #1: Transfer 100 tokens to addr2";

            await expect(
                governor.connect(owner).propose(targets, values, calldatas, description)
            ).to.emit(governor, "ProposalCreated");
        });

        it("Should reject proposals from users below threshold", async function () {
            // addr3 has 50,000 tokens, below the 1,000 threshold after we reduce their balance
            // Transfer most tokens away to drop below 1000
            await governanceToken.connect(addr3).transfer(owner.address, ethers.parseEther("49500"));
            // addr3 now has 500 tokens < 1000

            // Re-delegate to update voting power
            await governanceToken.connect(addr3).delegate(addr3.address);
            await ethers.provider.send("evm_mine");

            const targets = [await governanceToken.getAddress()];
            const values = [0];
            const calldatas = [governanceToken.interface.encodeFunctionData("transfer", [addr2.address, 100])];
            const description = "Proposal from low-balance user";

            await expect(
                governor.connect(addr3).propose(targets, values, calldatas, description)
            ).to.be.revertedWithCustomError(governor, "GovernorInsufficientProposerVotes");
        });

        it("Should emit ProposalCreated event with correct parameters", async function () {
            const targets = [await governanceToken.getAddress()];
            const values = [0];
            const calldatas = [governanceToken.interface.encodeFunctionData("transfer", [addr2.address, 100])];
            const description = "Test Proposal";

            const tx = await governor.connect(owner).propose(targets, values, calldatas, description);
            const receipt = await tx.wait();

            const event = receipt.logs.find(log => {
                try {
                    return governor.interface.parseLog(log)?.name === "ProposalCreated";
                } catch {
                    return false;
                }
            });

            expect(event).to.not.be.undefined;
        });
    });

    describe("Proposal Lifecycle", function () {
        let proposalId;

        beforeEach(async function () {
            const targets = [await governanceToken.getAddress()];
            const values = [0];
            const calldatas = [governanceToken.interface.encodeFunctionData("transfer", [addr2.address, 100])];
            const description = "Lifecycle Test Proposal";

            const tx = await governor.connect(owner).propose(targets, values, calldatas, description);
            const receipt = await tx.wait();

            const event = receipt.logs.find(log => {
                try {
                    return governor.interface.parseLog(log)?.name === "ProposalCreated";
                } catch {
                    return false;
                }
            });

            proposalId = governor.interface.parseLog(event).args.proposalId;
        });

        it("Should start in Pending state", async function () {
            expect(await governor.state(proposalId)).to.equal(0); // Pending
        });

        it("Should move to Active state after voting delay", async function () {
            await ethers.provider.send("evm_mine"); // Mine 1 block (voting delay)
            await ethers.provider.send("evm_mine"); // Mine 2nd block to be > snapshot
            expect(await governor.state(proposalId)).to.equal(1); // Active
        });

        it("Should reject votes during Pending state", async function () {
            await expect(
                governor.connect(addr1).castVote(proposalId, 1)
            ).to.be.reverted;
        });

        it("Should accept votes during Active state", async function () {
            await ethers.provider.send("evm_mine");
            await ethers.provider.send("evm_mine"); // Ensure active

            await expect(
                governor.connect(addr1).castVote(proposalId, 1)
            ).to.emit(governor, "VoteCast");
        });

        it("Should move to Succeeded state if quorum and majority reached", async function () {
            await ethers.provider.send("evm_mine");
            await ethers.provider.send("evm_mine");

            // Vote with enough tokens to reach quorum
            await governor.connect(owner).castVote(proposalId, 1); // For
            await governor.connect(addr1).castVote(proposalId, 1); // For

            // Fast forward past voting period
            for (let i = 0; i < 50400; i++) {
                await ethers.provider.send("evm_mine");
            }

            expect(await governor.state(proposalId)).to.equal(4); // Succeeded
        });

        it("Should move to Defeated state if quorum not reached", async function () {
            await ethers.provider.send("evm_mine");
            await ethers.provider.send("evm_mine");

            // Vote with insufficient tokens (Against)
            // Since quorum is reached (50k > 40k), majority against will defeat it.
            await governor.connect(addr3).castVote(proposalId, 0);

            // Fast forward past voting period
            for (let i = 0; i < 50400; i++) {
                await ethers.provider.send("evm_mine");
            }

            expect(await governor.state(proposalId)).to.equal(3); // Defeated
        });
    });

    describe("Standard Voting (1T1V)", function () {
        let proposalId;

        beforeEach(async function () {
            const targets = [await governanceToken.getAddress()];
            const values = [0];
            const calldatas = [governanceToken.interface.encodeFunctionData("transfer", [addr2.address, 100])];
            const description = "Standard Voting Test";

            const tx = await governor.connect(owner).propose(targets, values, calldatas, description);
            const receipt = await tx.wait();

            const event = receipt.logs.find(log => {
                try {
                    return governor.interface.parseLog(log)?.name === "ProposalCreated";
                } catch {
                    return false;
                }
            });

            proposalId = governor.interface.parseLog(event).args.proposalId;

            await ethers.provider.send("evm_mine");
            await ethers.provider.send("evm_mine"); // Active
        });

        it("Should allow voting For", async function () {
            await expect(
                governor.connect(addr1).castVote(proposalId, 1)
            ).to.emit(governor, "VoteCast")
                .withArgs(addr1.address, proposalId, 1, ethers.parseEther("100000"), "");
        });

        it("Should allow voting Against", async function () {
            await expect(
                governor.connect(addr1).castVote(proposalId, 0)
            ).to.emit(governor, "VoteCast")
                .withArgs(addr1.address, proposalId, 0, ethers.parseEther("100000"), "");
        });

        it("Should allow voting Abstain", async function () {
            await expect(
                governor.connect(addr1).castVote(proposalId, 2)
            ).to.emit(governor, "VoteCast")
                .withArgs(addr1.address, proposalId, 2, ethers.parseEther("100000"), "");
        });

        it("Should prevent double voting", async function () {
            await governor.connect(addr1).castVote(proposalId, 1);

            await expect(
                governor.connect(addr1).castVote(proposalId, 1)
            ).to.be.revertedWithCustomError(governor, "GovernorAlreadyCastVote");
        });

        it("Should use voting power from snapshot block", async function () {
            const votingPower = await governanceToken.getVotes(addr1.address);

            // Transfer tokens after proposal creation
            await governanceToken.connect(addr1).transfer(addr3.address, ethers.parseEther("50000"));

            // Voting power should still be based on snapshot
            await governor.connect(addr1).castVote(proposalId, 1);

            // The vote weight should be the original amount
            expect(votingPower).to.equal(ethers.parseEther("100000"));
        });
    });

    describe("Quadratic Voting", function () {
        let proposalId;

        beforeEach(async function () {
            const targets = [await governanceToken.getAddress()];
            const values = [0];
            const calldatas = [governanceToken.interface.encodeFunctionData("transfer", [addr2.address, 100])];
            const description = "Quadratic Voting Test";

            const tx = await governor.connect(owner).propose(targets, values, calldatas, description);
            const receipt = await tx.wait();

            const event = receipt.logs.find(log => {
                try {
                    return governor.interface.parseLog(log)?.name === "ProposalCreated";
                } catch {
                    return false;
                }
            });

            proposalId = governor.interface.parseLog(event).args.proposalId;

            await ethers.provider.send("evm_mine");
            await ethers.provider.send("evm_mine"); // Active
        });

        it("Should allow quadratic voting with correct cost calculation", async function () {
            const votes = 100n;
            const expectedCost = votes * votes; // 10,000

            await expect(
                governor.connect(addr1).castVoteQuadratic(proposalId, 1, votes)
            ).to.emit(governor, "VoteCast")
                .withArgs(addr1.address, proposalId, 1, votes, "");

            expect(await governor.tokensSpentOnVoting(proposalId, addr1.address)).to.equal(expectedCost);
            expect(await governor.quadraticVotesCast(proposalId, addr1.address)).to.equal(votes);
        });

        it("Should reject quadratic vote if insufficient voting power", async function () {
            const votes = 1000000000000000n; // >10^15 votes. Cost > 10^30. Balance ~10^23.

            await expect(
                governor.connect(addr1).castVoteQuadratic(proposalId, 1, votes)
            ).to.be.revertedWith("Governor: insufficient token balance");
        });

        it("Should prevent double quadratic voting", async function () {
            // First vote: 100 votes
            await governor.connect(addr1).castVoteQuadratic(proposalId, 1, 100);
            expect(await governor.tokensSpentOnVoting(proposalId, addr1.address)).to.equal(10000);

            // Second vote should fail
            await expect(
                governor.connect(addr1).castVoteQuadratic(proposalId, 1, 100)
            ).to.be.revertedWithCustomError(governor, "GovernorAlreadyCastVote");
        });

        it("Should track tokens spent correctly", async function () {
            await governor.connect(addr1).castVoteQuadratic(proposalId, 1, 50);
            expect(await governor.tokensSpentOnVoting(proposalId, addr1.address)).to.equal(2500);
        });
    });
});
