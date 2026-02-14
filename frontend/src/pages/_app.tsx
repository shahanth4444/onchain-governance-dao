import '@/styles/globals.css';
// import '@rainbow-me/rainbowkit/styles.css';
import type { AppProps } from 'next/app';
// import { getDefaultConfig, RainbowKitProvider, darkTheme } from '@rainbow-me/rainbowkit';
import { createConfig, http } from 'wagmi';
import { mainnet, sepolia, hardhat } from 'wagmi/chains';
import { WagmiProvider } from 'wagmi';
import { QueryClientProvider, QueryClient } from "@tanstack/react-query";

const config = createConfig({
    chains: [hardhat, sepolia],
    transports: {
        [hardhat.id]: http(),
        [sepolia.id]: http(),
    },
    // ssr: false, // Not needed for createConfig?
});

const queryClient = new QueryClient();

export default function App({ Component, pageProps }: AppProps) {
    return (
        <WagmiProvider config={config}>
            <QueryClientProvider client={queryClient}>
                <Component {...pageProps} />
            </QueryClientProvider>
        </WagmiProvider>
    );
}
