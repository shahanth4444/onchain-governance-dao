import { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import WalletConnect from '@/components/WalletConnect';
import VoteChart from '@/components/VoteChart';
import { useAccount, useReadContract, useWriteContract } from 'wagmi';
import { GOVERNOR_ADDRESS, GOVERNANCE_TOKEN_ADDRESS, MyGovernorABI, GovernanceTokenABI } from '@/utils/contracts';
import { parseEther } from 'viem';

const MOCK_DETAILS = {
    "1": {
        id: "1",
        proposer: "0x123...abc",
        targets: ["0xToken..."],
        values: ["0"],
        signatures: ["transfer(address,uint256)"],
        calldatas: ["0x..."],
        startBlock: 12345678,
        endBlock: 12350718,
        description: "Proposal #1: Increase Quorum to 5%\n\nThis proposal seeks to increase the quorum requirement...",
        state: 1, // Active
        forVotes: 1500,
        againstVotes: 200,
        abstainVotes: 50,
        mechanism: 0 // Standard
    },
    "2": {
        id: "2",
        proposer: "0x456...def",
        description: "Proposal #2: Grant 1000 tokens to Team",
        state: 3, // Defeated
        forVotes: 500,
        againstVotes: 2000,
        abstainVotes: 0,
        mechanism: 1 // Quadratic
    }
};

const STATUS_LABELS = ['Pending', 'Active', 'Canceled', 'Defeated', 'Succeeded', 'Queued', 'Expired', 'Executed'];

export default function ProposalDetail() {
    const router = useRouter();
    const { id } = router.query;
    const { isConnected, address } = useAccount();
    const { writeContractAsync } = useWriteContract();

    const [votes, setVotes] = useState(1);
    const [isVoting, setIsVoting] = useState(false);
    const [allowance, setAllowance] = useState(BigInt(0));

    // Fetch allowance using hooks
    const { data: currentAllowance, refetch: refetchAllowance } = useReadContract({
        address: GOVERNANCE_TOKEN_ADDRESS as `0x${string}`,
        abi: GovernanceTokenABI,
        functionName: 'allowance',
        args: [address, GOVERNOR_ADDRESS],
        query: {
            enabled: !!address && !!GOVERNOR_ADDRESS,
        }
    });

    useEffect(() => {
        if (currentAllowance) {
            setAllowance(currentAllowance as bigint);
        }
    }, [currentAllowance]);

    const proposal = MOCK_DETAILS[id as keyof typeof MOCK_DETAILS];

    if (!proposal) return <div className="p-8 text-center text-white">Loading...</div>;

    const cost = BigInt(votes * votes);
    const needsApproval = proposal.mechanism === 1 && allowance < cost;

    const handleApprove = async () => {
        if (!isConnected) return;
        setIsVoting(true);
        try {
            await writeContractAsync({
                address: GOVERNANCE_TOKEN_ADDRESS as `0x${string}`,
                abi: GovernanceTokenABI,
                functionName: 'approve',
                args: [GOVERNOR_ADDRESS, cost],
            });
            await refetchAllowance();
            alert('Approval successful!');
        } catch (err) {
            console.error(err);
            alert('Failed to approve tokens');
        } finally {
            setIsVoting(false);
        }
    };

    const handleVote = async (support: number) => {
        if (!isConnected) return;
        setIsVoting(true);

        try {
            if (proposal.mechanism === 1) {
                // Quadratic Voting
                if (needsApproval) {
                    alert('Please approve tokens first');
                    setIsVoting(false);
                    return;
                }

                await writeContractAsync({
                    address: GOVERNOR_ADDRESS as `0x${string}`,
                    abi: MyGovernorABI,
                    functionName: 'castVoteQuadratic',
                    args: [BigInt(proposal.id), support, BigInt(votes)],
                });
            } else {
                // Standard Voting
                await writeContractAsync({
                    address: GOVERNOR_ADDRESS as `0x${string}`,
                    abi: MyGovernorABI,
                    functionName: 'castVote',
                    args: [BigInt(proposal.id), support],
                });
            }
            alert('Vote cast successfully!');
        } catch (err) {
            console.error(err);
            alert('Failed to cast vote');
        } finally {
            setIsVoting(false);
        }
    };

    return (
        <div className="min-h-screen">
            <Head>
                <title>Proposal #{id} - Governance DAO</title>
            </Head>

            <nav className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-xl sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center font-bold text-white">
                            G
                        </div>
                        <h1 className="text-xl font-bold">Proposal #{id}</h1>
                    </div>
                    <WalletConnect />
                </div>
            </nav>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                    {/* Main Content */}
                    <div className="lg:col-span-2 space-y-6">
                        <div className="card">
                            <div className="flex items-center justify-between mb-4">
                                <span className={`px-3 py-1 rounded-full text-sm font-medium 
                  ${proposal.state === 1 ? 'bg-green-500/20 text-green-400' : 'bg-slate-700 text-slate-300'}`}>
                                    {STATUS_LABELS[proposal.state]}
                                </span>
                                <span className="text-slate-400 text-sm">
                                    Mechanism: {proposal.mechanism === 0 ? 'Standard (1T1V)' : 'Quadratic'}
                                </span>
                            </div>

                            <h2 className="text-2xl font-bold mb-4 whitespace-pre-wrap">
                                {proposal.description}
                            </h2>

                            <div className="flex items-center gap-2 text-sm text-slate-400 mb-6">
                                <span>Proposed by</span>
                                <span className="font-mono bg-slate-800 px-2 py-1 rounded">
                                    {proposal.proposer}
                                </span>
                            </div>

                            <div className="prose prose-invert max-w-none">
                                <h3 className="text-lg font-semibold mb-2">Execution Details</h3>
                                <ul className="list-disc pl-5 space-y-1 text-slate-300">
                                    {proposal.targets?.map((target, i) => (
                                        <li key={i}>
                                            Target: <span className="font-mono text-xs">{target}</span><br />
                                            Signature: <span className="font-mono text-xs">{proposal.signatures?.[i] || 'N/A'}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>

                        {/* Voting Interface */}
                        {proposal.state === 1 && (
                            <div className="card border-blue-500/30">
                                <h3 className="text-xl font-bold mb-4">Cast Your Vote</h3>

                                {proposal.mechanism === 1 && (
                                    <div className="mb-6 p-4 bg-slate-900/50 rounded-lg">
                                        <label className="block text-sm font-medium mb-2">
                                            Quadratic Votes
                                        </label>
                                        <div className="flex items-center gap-4">
                                            <input
                                                type="number"
                                                min="1"
                                                value={votes}
                                                onChange={(e) => setVotes(Math.max(1, parseInt(e.target.value) || 1))}
                                                className="input-field w-32"
                                            />
                                            <div className="text-sm text-slate-400">
                                                Cost: <span className="text-blue-400 font-bold">{votes * votes}</span> tokens
                                            </div>
                                        </div>
                                        {needsApproval && (
                                            <div className="mt-4">
                                                <p className="text-yellow-500 text-sm mb-2">
                                                    You need to approve tokens before voting.
                                                </p>
                                                <button
                                                    onClick={handleApprove}
                                                    disabled={isVoting}
                                                    className="btn-secondary w-full"
                                                >
                                                    Approve {votes * votes} Tokens
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                )}

                                <div className="grid grid-cols-3 gap-4">
                                    <button
                                        onClick={() => handleVote(1)}
                                        disabled={isVoting || needsApproval}
                                        className="btn-primary bg-green-600 hover:bg-green-700 py-3 disabled:opacity-50 disabled:cursor-not-allowed"
                                        data-testid="vote-for-button"
                                    >
                                        Vote For
                                    </button>
                                    <button
                                        onClick={() => handleVote(0)}
                                        disabled={isVoting || needsApproval}
                                        className="btn-primary bg-red-600 hover:bg-red-700 py-3 disabled:opacity-50 disabled:cursor-not-allowed"
                                        data-testid="vote-against-button"
                                    >
                                        Vote Against
                                    </button>
                                    <button
                                        onClick={() => handleVote(2)}
                                        disabled={isVoting || needsApproval}
                                        className="btn-secondary py-3 disabled:opacity-50 disabled:cursor-not-allowed"
                                        data-testid="vote-abstain-button"
                                    >
                                        Abstain
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Sidebar Stats */}
                    <div className="space-y-6">
                        <div className="card">
                            <h3 className="text-lg font-bold mb-4">Current Results</h3>
                            <VoteChart
                                forVotes={proposal.forVotes}
                                againstVotes={proposal.againstVotes}
                                abstainVotes={proposal.abstainVotes}
                            />

                            <div className="mt-6 space-y-3">
                                <div className="flex justify-between items-center p-2 rounded bg-green-500/10 border border-green-500/20">
                                    <span className="text-green-400 font-medium">For</span>
                                    <span className="font-bold">{proposal.forVotes.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between items-center p-2 rounded bg-red-500/10 border border-red-500/20">
                                    <span className="text-red-400 font-medium">Against</span>
                                    <span className="font-bold">{proposal.againstVotes.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between items-center p-2 rounded bg-slate-500/10 border border-slate-500/20">
                                    <span className="text-slate-400 font-medium">Abstain</span>
                                    <span className="font-bold">{proposal.abstainVotes.toLocaleString()}</span>
                                </div>
                            </div>
                        </div>

                        <div className="card">
                            <h3 className="text-lg font-bold mb-4">Information</h3>
                            <div className="space-y-4 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-slate-400">Start Block</span>
                                    <span className="font-mono">{proposal.startBlock}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-400">End Block</span>
                                    <span className="font-mono">{proposal.endBlock}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-400">Quorum</span>
                                    <span className="font-mono text-blue-400">Reached</span>
                                </div>
                            </div>
                        </div>
                    </div>

                </div>
            </main>
        </div>
    );
}
