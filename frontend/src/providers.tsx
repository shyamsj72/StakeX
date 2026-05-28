"use client";

import * as React from "react";
import '@rainbow-me/rainbowkit/styles.css';
import {
  getDefaultConfig,
  RainbowKitProvider,
  darkTheme,
} from '@rainbow-me/rainbowkit';
import { WagmiProvider } from 'wagmi';
import {
  sepolia,
} from 'wagmi/chains';
import {
  QueryClientProvider,
  QueryClient,
} from "@tanstack/react-query";

const config = getDefaultConfig({
  appName: 'SCAI StakeX',
  projectId: '21fef48091f12692cad574a6f7753643', // A highly available demo WalletConnect ID
  chains: [sepolia],
  ssr: true,
});

const queryClient = new QueryClient();

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider theme={darkTheme({
            accentColor: '#6366f1',
            accentColorForeground: 'white',
            borderRadius: 'medium',
        })}>
          {children}
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
