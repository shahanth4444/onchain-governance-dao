// Try to import from generated files, fallback to env vars or placeholders
import GovernanceTokenArtifact from '../contracts/GovernanceToken.json';
import MyGovernorArtifact from '../contracts/MyGovernor.json';

export const GOVERNANCE_TOKEN_ADDRESS =
    GovernanceTokenArtifact.address !== "0x0000000000000000000000000000000000000000"
        ? GovernanceTokenArtifact.address
        : (process.env.NEXT_PUBLIC_GOVERNANCE_TOKEN_ADDRESS || "0x0000000000000000000000000000000000000000");

export const GOVERNOR_ADDRESS =
    MyGovernorArtifact.address !== "0x0000000000000000000000000000000000000000"
        ? MyGovernorArtifact.address
        : (process.env.NEXT_PUBLIC_GOVERNOR_ADDRESS || "0x0000000000000000000000000000000000000000");

export const GovernanceTokenABI = GovernanceTokenArtifact.abi.length > 0
    ? GovernanceTokenArtifact.abi
    : [
        "function delegate(address delegatee) external",
        "function getVotes(address account) external view returns (uint256)",
        "function transfer(address to, uint256 amount) external returns (bool)",
        "function balanceOf(address account) external view returns (uint256)",
        "event DelegateChanged(address indexed delegator, address indexed fromDelegate, address indexed toDelegate)"
    ];

export const MyGovernorABI = MyGovernorArtifact.abi.length > 0
    ? MyGovernorArtifact.abi
    : [
        "function propose(address[] memory targets, uint256[] memory values, bytes[] memory calldatas, string memory description) public returns (uint256)",
        "function castVote(uint256 proposalId, uint8 support) public returns (uint256)",
        "function castVoteQuadratic(uint256 proposalId, uint8 support, uint256 votes) public returns (uint256)",
        "function state(uint256 proposalId) public view returns (uint8)",
        "function proposalSnapshot(uint256 proposalId) public view returns (uint256)",
        "function proposalDeadline(uint256 proposalId) public view returns (uint256)",
        "function proposalVotes(uint256 proposalId) public view returns (uint256 againstVotes, uint256 forVotes, uint256 abstainVotes)",
        "function getQuadraticVotes(uint256 proposalId, address account) public view returns (uint256)",
        "event ProposalCreated(uint256 proposalId, address proposer, address[] targets, uint256[] values, string[] signatures, bytes[] calldatas, uint256 startBlock, uint256 endBlock, string description)",
        "event VoteCast(address indexed voter, uint256 proposalId, uint8 support, uint256 weight, string reason)"
    ];
