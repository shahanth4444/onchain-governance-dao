import { useAccount, useConnect, useDisconnect, useBalance } from 'wagmi';
import { injected } from 'wagmi/connectors';
import { useState, useEffect } from 'react';

export default function WalletConnect() {
    const { address, isConnected, chain } = useAccount();
    const { connect } = useConnect();
    const { disconnect } = useDisconnect();
    const { data: balance } = useBalance({ address });
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) return null;

    if (isConnected) {
        return (
            <div className="flex items-center gap-4">
                {chain?.name && (
                    <div className="px-3 py-1.5 bg-slate-800 rounded-lg border border-slate-700 text-sm text-slate-300">
                        {chain.name}
                    </div>
                )}
                <div className="flex items-center gap-3">
                    <div className="text-right hidden sm:block">
                        <div className="text-sm font-medium text-white" data-testid="user-address">
                            {address?.slice(0, 6)}...{address?.slice(-4)}
                        </div>
                        {balance && (
                            <div className="text-xs text-slate-400">
                                {parseFloat(balance.formatted).toFixed(4)} {balance.symbol}
                            </div>
                        )}
                    </div>
                    <button
                        onClick={() => disconnect()}
                        className="btn-secondary text-sm"
                        type="button"
                    >
                        Disconnect
                    </button>
                </div>
            </div>
        );
    }

    return (
        <button
            onClick={() => connect({ connector: injected() })}
            className="btn-primary"
            data-testid="connect-wallet-button"
            type="button"
        >
            Connect Wallet
        </button>
    );
}
