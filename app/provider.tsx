"use client";

import { Web3AuthProvider } from "@web3auth/modal/react";
import { WEB3AUTH_NETWORK } from "@web3auth/modal";
import { type Web3AuthContextConfig } from "@web3auth/modal/react";
import { type IWeb3AuthState } from "@web3auth/modal";
import JupiterProvider from "@/providers/JupProvider";
import { SolanaRPCProvider } from "@/providers/SolanaRPCProvider";
import { UserWalletProvider } from "@/contexts/UserWalletContext";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";

const clientId =
  "BBGhz2BZSY0CqLSBWKCJ1voqLSLhgnaqRbXmW48h2D-MKLaIfhqwMobqtYrSYz0CIf42UGmVvZnTYrrgg2zqJPA"; // get from https://dashboard.web3auth.io

const web3AuthContextConfig: Web3AuthContextConfig = {
  web3AuthOptions: {
    clientId,
    web3AuthNetwork: WEB3AUTH_NETWORK.SAPPHIRE_MAINNET,
    uiConfig: {
      logoLight: "",
      logoDark: "",
    },
  },
};

export default function Provider({
  children,
  web3authInitialState,
}: {
  children: React.ReactNode;
  web3authInitialState?: IWeb3AuthState;
}) {
  // Create a client with optimized settings
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 5 * 60 * 1000, // 5 minutes
        gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
        retry: (failureCount, error) => {
          // Don't retry on 4xx errors
          if (error instanceof Error && error.message.includes("4"))
            return false;
          return failureCount < 2;
        },
        refetchOnWindowFocus: false,
        refetchOnMount: true,
        refetchOnReconnect: true,
      },
      mutations: {
        retry: 1,
        gcTime: 0, // Don't cache mutation results
      },
    },
  });

  return (
    <QueryClientProvider client={queryClient}>
      <Web3AuthProvider
        config={web3AuthContextConfig}
        initialState={web3authInitialState}
      >
        <SolanaRPCProvider>
          <UserWalletProvider>
            <JupiterProvider>{children}</JupiterProvider>
          </UserWalletProvider>
        </SolanaRPCProvider>
      </Web3AuthProvider>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
