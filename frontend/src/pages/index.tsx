import Head from 'next/head';
import ProposalList from '@/components/ProposalList';
import Link from 'next/link';
import dynamic from 'next/dynamic';

const WalletConnect = dynamic(() => import('@/components/WalletConnect'), {
    ssr: false,
});

import { useAccount } from 'wagmi';

export default function Home() {
    const { isConnected } = useAccount();

    return (
        <div className="min-h-screen">
            <Head>
                <title>Governance DAO</title>
                <meta name="description" content="Decentralized On-Chain Governance Platform" />
            </Head>

            <nav className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-xl sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center font-bold text-white">
                            G
                        </div>
                        <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400">
                            Governance DAO
                        </h1>
                    </div>
                    <WalletConnect />
                </div>
            </nav>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="flex flex-col gap-12">
                    {/* Hero Section */}
                    <div className="text-center space-y-6 py-12 relative overflow-hidden">
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-3xl -z-10" />

                        <h2 className="text-5xl font-bold tracking-tight">
                            Shape the Future of <br />
                            <span className="text-blue-500">Decentralized Governance</span>
                        </h2>
                        <p className="text-xl text-slate-400 max-w-2xl mx-auto">
                            Participate in on-chain decision making using standard or quadratic voting mechanisms.
                            Your voice matters.
                        </p>

                        {isConnected && (
                            <div className="flex justify-center gap-4">
                                <Link
                                    href="/create"
                                    className="btn-primary flex items-center gap-2"
                                >
                                    Create Proposal
                                </Link>
                                <a
                                    href="#proposals"
                                    className="btn-secondary"
                                >
                                    View Proposals
                                </a>
                            </div>
                        )}
                    </div>

                    {/* Stats Section */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="card">
                            <h3 className="text-slate-400 text-sm font-medium mb-2">Total Proposals</h3>
                            <p className="text-3xl font-bold text-white">12</p>
                        </div>
                        <div className="card">
                            <h3 className="text-slate-400 text-sm font-medium mb-2">Active Votes</h3>
                            <p className="text-3xl font-bold text-blue-400">3</p>
                        </div>
                        <div className="card">
                            <h3 className="text-slate-400 text-sm font-medium mb-2">Governance Token</h3>
                            <p className="text-3xl font-bold text-purple-400">$GOV</p>
                        </div>
                    </div>

                    {/* Proposals Section */}
                    <div id="proposals" className="space-y-6">
                        <div className="flex items-center justify-between">
                            <h3 className="text-2xl font-bold">Recent Proposals</h3>
                            <div className="flex gap-2">
                                <select className="bg-slate-800 border-slate-700 rounded-lg px-3 py-1 text-sm text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500">
                                    <option>All Status</option>
                                    <option>Active</option>
                                    <option>Pending</option>
                                    <option>Executed</option>
                                </select>
                            </div>
                        </div>

                        <ProposalList />
                    </div>
                </div>
            </main>
        </div>
    );
}
