"use client";

import * as React from "react";
import '@rainbow-me/rainbowkit/styles.css';
import {
  RainbowKitProvider,
  darkTheme,
  connectorsForWallets,
  Wallet
} from '@rainbow-me/rainbowkit';
import { injectedWallet } from '@rainbow-me/rainbowkit/wallets';
import { createConfig, http, WagmiProvider } from 'wagmi';
import {
  mainnet,
  sepolia,
  hardhat,
} from 'wagmi/chains';
import {
  QueryClientProvider,
  QueryClient,
} from "@tanstack/react-query";

// Custom MetaMask wallet that bypasses WalletConnect completely
const customMetaMaskWallet = (): Wallet => {
  const injected = injectedWallet();
  return {
    ...injected,
    id: 'metamask',
    name: 'MetaMask',
    iconUrl: 'https://upload.wikimedia.org/wikipedia/commons/3/36/MetaMask_Fox.svg',
    iconBackground: '#fff',
  };
};

const connectors = connectorsForWallets(
  [
    {
      groupName: 'Recommended',
      wallets: [customMetaMaskWallet],
    },
  ],
  {
    appName: 'SCAI StakeX',
    projectId: 'c037803baee8e59ec217c46014e3ce18', 
  }
);

const config = createConfig({
  connectors,
  chains: [hardhat, sepolia, mainnet],
  transports: {
    [hardhat.id]: http(),
    [sepolia.id]: http(),
    [mainnet.id]: http(),
  },
  ssr: true,
});

const queryClient = new QueryClient();

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider theme={darkTheme({
            accentColor: '#6366f1', // Indigo-500
            accentColorForeground: 'white',
            borderRadius: 'medium',
        })}>
          {children}
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
