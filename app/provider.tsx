"use client";

import {
  Web3AuthProvider,
  type Web3AuthContextConfig,
} from "@web3auth/modal/react";
import { IWeb3AuthState, WEB3AUTH_NETWORK } from "@web3auth/modal";
// IMP START - Setup Wagmi Provider
import { WagmiProvider } from "@web3auth/modal/react/wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";

const clientId =
  "BP4yaMmsbp8bIwWTF0Xg2gmGJsaa4t84yxUABuo5_2uD4ITKDKThS_rac5Qjbs_CRgk8orjINbts3sjZ4HnI3dU"; // get from https://dashboard.web3auth.io

const queryClient = new QueryClient();

const web3AuthContextConfig: Web3AuthContextConfig = {
  web3AuthOptions: {
    clientId,
    web3AuthNetwork: WEB3AUTH_NETWORK.SAPPHIRE_DEVNET,
    ssr: true,
  },
};

export default function Provider({
  children,
  web3authInitialState,
}: {
  children: React.ReactNode;
  web3authInitialState: IWeb3AuthState | undefined;
}) {
  return (
    // IMP START - SSR
    <Web3AuthProvider
      config={web3AuthContextConfig}
      initialState={web3authInitialState}
    >
      {/* // IMP END - Setup Web3Auth Provider */}
      <QueryClientProvider client={queryClient}>
        <WagmiProvider>{children}</WagmiProvider>
      </QueryClientProvider>
      {/*// IMP START - Setup Web3Auth Provider */}
    </Web3AuthProvider>
  );
}
