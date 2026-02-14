const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("GovernanceToken", function () {
    let governanceToken;
    let owner, addr1, addr2;

    beforeEach(async function () {
        [owner, addr1, addr2] = await ethers.getSigners();

        const GovernanceToken = await ethers.getContractFactory("GovernanceToken");
        governanceToken = await GovernanceToken.deploy();
        await governanceToken.waitForDeployment();
    });

    describe("Deployment", function () {
        it("Should set the right name and symbol", async function () {
            expect(await governanceToken.name()).to.equal("GovernanceToken");
            expect(await governanceToken.symbol()).to.equal("GOV");
        });

        it("Should mint initial supply to deployer", async function () {
            const expectedSupply = ethers.parseEther("1000000");
            expect(await governanceToken.totalSupply()).to.equal(expectedSupply);
            expect(await governanceToken.balanceOf(owner.address)).to.equal(expectedSupply);
        });
    });

    describe("Delegation", function () {
        it("Should allow token holders to delegate voting power", async function () {
            // Transfer tokens to addr1
            const amount = ethers.parseEther("1000");
            await governanceToken.transfer(addr1.address, amount);

            // Delegate to addr2
            await expect(governanceToken.connect(addr1).delegate(addr2.address))
                .to.emit(governanceToken, "DelegateChanged")
                .withArgs(addr1.address, ethers.ZeroAddress, addr2.address);
        });

        it("Should update voting power after delegation", async function () {
            const amount = ethers.parseEther("1000");
            await governanceToken.transfer(addr1.address, amount);

            // Before delegation
            expect(await governanceToken.getVotes(addr1.address)).to.equal(0);
            expect(await governanceToken.getVotes(addr2.address)).to.equal(0);

            // Delegate
            await governanceToken.connect(addr1).delegate(addr2.address);

            // After delegation
            expect(await governanceToken.getVotes(addr1.address)).to.equal(0);
            expect(await governanceToken.getVotes(addr2.address)).to.equal(amount);
        });

        it("Should allow self-delegation", async function () {
            const amount = ethers.parseEther("1000");
            await governanceToken.transfer(addr1.address, amount);

            await governanceToken.connect(addr1).delegate(addr1.address);
            expect(await governanceToken.getVotes(addr1.address)).to.equal(amount);
        });

        it("Should emit DelegateChanged event", async function () {
            await expect(governanceToken.connect(owner).delegate(owner.address))
                .to.emit(governanceToken, "DelegateChanged")
                .withArgs(owner.address, ethers.ZeroAddress, owner.address);
        });
    });

    describe("Voting Power Snapshots", function () {
        it("Should track historical voting power", async function () {
            const amount = ethers.parseEther("1000");
            await governanceToken.transfer(addr1.address, amount);
            await governanceToken.connect(addr1).delegate(addr1.address);

            // Mine a block
            await ethers.provider.send("evm_mine");
            const blockNumber = await ethers.provider.getBlockNumber();

            // Transfer more tokens
            await governanceToken.transfer(addr1.address, amount);

            // Check current votes (should be 2000)
            expect(await governanceToken.getVotes(addr1.address)).to.equal(amount * 2n);

            // Check past votes (should be 1000)
            expect(await governanceToken.getPastVotes(addr1.address, blockNumber - 1)).to.equal(amount);
        });

        it("Should not affect voting power after proposal creation", async function () {
            const amount = ethers.parseEther("1000");
            await governanceToken.transfer(addr1.address, amount);
            await governanceToken.connect(addr1).delegate(addr1.address);

            await ethers.provider.send("evm_mine");
            const snapshotBlock = await ethers.provider.getBlockNumber();

            // Transfer more tokens after snapshot
            await governanceToken.transfer(addr1.address, amount);

            // Voting power at snapshot should remain unchanged
            expect(await governanceToken.getPastVotes(addr1.address, snapshotBlock)).to.equal(amount);
        });
    });

    describe("Transfers", function () {
        it("Should transfer tokens between accounts", async function () {
            const amount = ethers.parseEther("100");
            await governanceToken.transfer(addr1.address, amount);
            expect(await governanceToken.balanceOf(addr1.address)).to.equal(amount);
        });

        it("Should update voting power after transfer with delegation", async function () {
            const amount = ethers.parseEther("1000");

            // Setup: addr1 has tokens and delegates to self
            await governanceToken.transfer(addr1.address, amount);
            await governanceToken.connect(addr1).delegate(addr1.address);
            expect(await governanceToken.getVotes(addr1.address)).to.equal(amount);

            // Transfer half to addr2
            const transferAmount = ethers.parseEther("500");
            await governanceToken.connect(addr1).transfer(addr2.address, transferAmount);

            // addr1's voting power should decrease
            expect(await governanceToken.getVotes(addr1.address)).to.equal(amount - transferAmount);

            // addr2 has no voting power (hasn't delegated)
            expect(await governanceToken.getVotes(addr2.address)).to.equal(0);
        });
    });

    describe("ERC20Permit", function () {
        it("Should have correct domain separator", async function () {
            const domain = await governanceToken.DOMAIN_SEPARATOR();
            expect(domain).to.not.equal(ethers.ZeroHash);
        });

        it("Should track nonces", async function () {
            expect(await governanceToken.nonces(owner.address)).to.equal(0);
        });
    });
});
