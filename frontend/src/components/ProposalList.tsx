import { useState, useEffect } from 'react';
import Link from 'next/link';

// Mock data for display until contract integration is fully tested
const MOCK_PROPOSALS = [
    {
        id: "1",
        description: "Proposal #1: Increase Quorum to 5%",
        proposer: "0x123...abc",
        state: 1, // Active
        forVotes: 1500,
        againstVotes: 200,
        endTime: Date.now() + 86400000
    },
    {
        id: "2",
        description: "Proposal #2: Grant 1000 tokens to Team",
        proposer: "0x456...def",
        state: 3, // Defeated
        forVotes: 500,
        againstVotes: 2000,
        endTime: Date.now() - 86400000
    },
    {
        id: "3",
        description: "Proposal #3: Update Voting Period",
        proposer: "0x789...ghi",
        state: 4, // Succeeded
        forVotes: 5000,
        againstVotes: 100,
        endTime: Date.now() - 172800000
    }
];

const STATE_MAP = {
    0: { label: 'Pending', color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50' },
    1: { label: 'Active', color: 'bg-green-500/20 text-green-400 border-green-500/50' },
    2: { label: 'Canceled', color: 'bg-slate-500/20 text-slate-400 border-slate-500/50' },
    3: { label: 'Defeated', color: 'bg-red-500/20 text-red-400 border-red-500/50' },
    4: { label: 'Succeeded', color: 'bg-blue-500/20 text-blue-400 border-blue-500/50' },
    5: { label: 'Queued', color: 'bg-indigo-500/20 text-indigo-400 border-indigo-500/50' },
    6: { label: 'Expired', color: 'bg-slate-500/20 text-slate-400 border-slate-500/50' },
    7: { label: 'Executed', color: 'bg-purple-500/20 text-purple-400 border-purple-500/50' },
};

export default function ProposalList() {
    // In a real app, use useReadContract from wagmi to fetch proposals
    // For now, using mock data for robust UI demonstration
    const [proposals, setProposals] = useState(MOCK_PROPOSALS);

    return (
        <div className="grid gap-4">
            {proposals.map((proposal) => {
                const status = STATE_MAP[proposal.state as keyof typeof STATE_MAP];
                const totalVotes = proposal.forVotes + proposal.againstVotes;
                const forPercentage = totalVotes > 0 ? (proposal.forVotes / totalVotes) * 100 : 0;

                return (
                    <Link
                        key={proposal.id}
                        href={`/proposals/${proposal.id}`}
                        className="card hover:border-blue-500/50 transition-all group"
                        data-testid="proposal-list-item"
                    >
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${status.color} mb-2`}>
                                    {status.label}
                                </div>
                                <h3 className="text-lg font-semibold group-hover:text-blue-400 transition-colors">
                                    {proposal.description}
                                </h3>
                                <p className="text-sm text-slate-400 mt-1">
                                    Proposed by {proposal.proposer}
                                </p>
                            </div>
                            <div className="text-right">
                                <div className="text-sm text-slate-400">Ends in</div>
                                <div className="font-mono text-lg font-medium">
                                    {proposal.state === 1 ? '23h 45m' : 'Ended'}
                                </div>
                            </div>
                        </div>

                        {/* Vote Progress */}
                        <div className="space-y-2">
                            <div className="flex justify-between text-sm text-slate-400">
                                <span>For: {proposal.forVotes.toLocaleString()}</span>
                                <span>Against: {proposal.againstVotes.toLocaleString()}</span>
                            </div>
                            <div className="h-2 bg-slate-700/50 rounded-full overflow-hidden flex">
                                <div
                                    className="h-full bg-green-500 transition-all"
                                    style={{ width: `${forPercentage}%` }}
                                />
                                <div
                                    className="h-full bg-red-500 transition-all"
                                    style={{ width: `${100 - forPercentage}%` }}
                                />
                            </div>
                        </div>
                    </Link>
                );
            })}
        </div>
    );
}
