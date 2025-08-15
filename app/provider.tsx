"use client";

import { Web3AuthProvider } from "@web3auth/modal/react";
import { WEB3AUTH_NETWORK } from "@web3auth/modal";
import { type Web3AuthContextConfig } from "@web3auth/modal/react";
import { type IWeb3AuthState } from "@web3auth/modal";
import JupiterProvider from "@/providers/JupProvider";
import { SolanaRPCProvider } from "@/providers/SolanaRPCProvider";
import { UserWalletProvider } from "@/contexts/UserWalletContext";

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
  return (
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
  );
}
