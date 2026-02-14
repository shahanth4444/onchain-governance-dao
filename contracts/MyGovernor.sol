// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/governance/Governor.sol";
import "@openzeppelin/contracts/governance/extensions/GovernorSettings.sol";
import "@openzeppelin/contracts/governance/extensions/GovernorCountingSimple.sol";
import "@openzeppelin/contracts/governance/extensions/GovernorVotes.sol";
import "@openzeppelin/contracts/governance/extensions/GovernorVotesQuorumFraction.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract MyGovernor is Governor, GovernorSettings, GovernorCountingSimple, GovernorVotes, GovernorVotesQuorumFraction {
    
    // Voting mechanism enum
    enum VotingMechanism { STANDARD, QUADRATIC }
    
    // Mapping to track voting mechanism for each proposal
    mapping(uint256 => VotingMechanism) public proposalVotingMechanism;
    
    // Mapping to track quadratic votes cast by users for each proposal
    mapping(uint256 => mapping(address => uint256)) public quadraticVotesCast;
    
    // Mapping to track tokens spent on quadratic voting
    mapping(uint256 => mapping(address => uint256)) public tokensSpentOnVoting;

    // Minimum token balance required to create a proposal
    uint256 public constant PROPOSAL_THRESHOLD = 1000 * 10**18; // 1000 tokens

    constructor(IVotes _token)
        Governor("MyGovernor")
        GovernorSettings(
            1, /* 1 block voting delay */
            50400, /* 1 week voting period (assuming 12s blocks) */
            PROPOSAL_THRESHOLD /* proposal threshold */
        )
        GovernorVotes(_token)
        GovernorVotesQuorumFraction(4) /* 4% quorum */
    {}

    // The following functions are overrides required by Solidity.

    function votingDelay()
        public
        view
        override(Governor, GovernorSettings)
        returns (uint256)
    {
        return super.votingDelay();
    }

    function votingPeriod()
        public
        view
        override(Governor, GovernorSettings)
        returns (uint256)
    {
        return super.votingPeriod();
    }

    function quorum(uint256 blockNumber)
        public
        view
        override(Governor, GovernorVotesQuorumFraction)
        returns (uint256)
    {
        return super.quorum(blockNumber);
    }

    function proposalThreshold()
        public
        view
        override(Governor, GovernorSettings)
        returns (uint256)
    {
        return super.proposalThreshold();
    }

    /**
     * @dev Cast vote using quadratic voting mechanism
     * @param proposalId The proposal ID
     * @param support Vote type (0=Against, 1=For, 2=Abstain)
     * @param votes Number of votes to cast
     * Cost in tokens = votes^2. Tokens are transferred from voter to this contract.
     */
    function castVoteQuadratic(
        uint256 proposalId,
        uint8 support,
        uint256 votes
    ) public returns (uint256) {
        require(state(proposalId) == ProposalState.Active, "Governor: vote not currently active");
        
        address voter = msg.sender;
        
        // Calculate cost: votes^2
        uint256 cost = votes * votes;
        
        // Check if user has enough tokens
        require(IERC20(address(token())).balanceOf(voter) >= cost, "Governor: insufficient token balance");

        // Transfer cost tokens from voter to this contract
        // Voter must have approved this contract to spend tokens
        bool success = IERC20(address(token())).transferFrom(voter, address(this), cost);
        require(success, "Governor: token transfer failed");
        
        // Update tracking
        tokensSpentOnVoting[proposalId][voter] += cost;
        quadraticVotesCast[proposalId][voter] += votes;
        
        // Count the votes (voting power = votes, not cost)
        _countVote(proposalId, voter, support, votes, "");
        
        emit VoteCast(voter, proposalId, support, votes, "");
        
        return votes;
    }
}
