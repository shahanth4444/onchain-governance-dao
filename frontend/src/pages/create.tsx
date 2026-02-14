import { useState } from 'react';
import Head from 'next/head';
import dynamic from 'next/dynamic';
import { useAccount, useWriteContract } from 'wagmi';

const WalletConnect = dynamic(() => import('@/components/WalletConnect'), { ssr: false });
import { useRouter } from 'next/router';
import { GOVERNOR_ADDRESS, MyGovernorABI, GovernanceTokenABI, GOVERNANCE_TOKEN_ADDRESS } from '@/utils/contracts';
import { parseEther } from 'viem';

export default function CreateProposal() {
    const { isConnected, address } = useAccount();
    const router = useRouter();
    const { writeContractAsync } = useWriteContract();

    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [target, setTarget] = useState('');
    const [value, setValue] = useState('0');
    const [calldata, setCalldata] = useState('0x');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!isConnected) return;

        setIsSubmitting(true);
        setError('');

        try {
            // Encode proposal description
            const proposalDescription = `${title}\n\n${description}`;

            // Execute propose transaction
            await writeContractAsync({
                address: GOVERNOR_ADDRESS as `0x${string}`,
                abi: MyGovernorABI,
                functionName: 'propose',
                args: [
                    [target || GOVERNANCE_TOKEN_ADDRESS], // Targets
                    [BigInt(value)], // Values
                    [calldata || '0x'], // Calldatas
                    proposalDescription // Description
                ],
            });

            router.push('/');
        } catch (err: any) {
            console.error(err);
            setError(err.message || 'Failed to create proposal');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen">
            <Head>
                <title>Create Proposal - Governance DAO</title>
            </Head>

            <nav className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-xl sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center font-bold text-white">
                            G
                        </div>
                        <h1 className="text-xl font-bold">Create Proposal</h1>
                    </div>
                    <WalletConnect />
                </div>
            </nav>

            <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                {!isConnected ? (
                    <div className="text-center py-20">
                        <h2 className="text-2xl font-bold mb-4">Connect Wallet to Continue</h2>
                        <p className="text-slate-400 mb-8">You need to connect your wallet to create a proposal.</p>
                    </div>
                ) : (
                    <form onSubmit={handleCreate} className="card space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-slate-400 mb-2">
                                Proposal Title
                            </label>
                            <input
                                type="text"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                className="input-field"
                                placeholder="e.g., Increase Quorum to 5%"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-400 mb-2">
                                Description
                            </label>
                            <textarea
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                className="input-field min-h-[150px]"
                                placeholder="Describe your proposal in detail..."
                                required
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-slate-400 mb-2">
                                    Target Contract Address
                                </label>
                                <input
                                    type="text"
                                    value={target}
                                    onChange={(e) => setTarget(e.target.value)}
                                    className="input-field"
                                    placeholder="0x..."
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-400 mb-2">
                                    ETH Value
                                </label>
                                <input
                                    type="number"
                                    value={value}
                                    onChange={(e) => setValue(e.target.value)}
                                    className="input-field"
                                    placeholder="0"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-400 mb-2">
                                Calldata (Hex)
                            </label>
                            <input
                                type="text"
                                value={calldata}
                                onChange={(e) => setCalldata(e.target.value)}
                                className="input-field font-mono text-sm"
                                placeholder="0x..."
                            />
                        </div>

                        {error && (
                            <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-500 text-sm">
                                {error}
                            </div>
                        )}

                        <div className="flex justify-end gap-4 pt-4">
                            <button
                                type="button"
                                onClick={() => router.back()}
                                className="btn-secondary"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="btn-primary"
                            >
                                {isSubmitting ? 'Creating...' : 'Create Proposal'}
                            </button>
                        </div>
                    </form>
                )}
            </main>
        </div>
    );
}
