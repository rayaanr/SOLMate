"use client";

import { createJupiterApiClient } from "@jup-ag/api";
import { Connection, PublicKey } from "@solana/web3.js";
import { useSolanaWallet } from "@web3auth/modal/react/solana";
import { createContext, useContext, ReactNode } from "react";

// Create Jupiter API client instance
const jupiterApi = createJupiterApiClient();

// Create context for Jupiter API
const JupiterContext = createContext<{
  jupiterApi: ReturnType<typeof createJupiterApiClient>;
  connection: Connection | null;
  userPublicKey: PublicKey | null;
} | null>(null);

const JupiterProvider = ({ children }: { children: ReactNode }) => {
  const { accounts, connection } = useSolanaWallet();

  // Use your Helius RPC or Web3Auth connection
  const jupiterConnection =
    connection ||
    new Connection(
      process.env.NEXT_PUBLIC_HELIUS_RPC_URL ||
        "https://api.mainnet-beta.solana.com",
      "confirmed"
    );

  let userPublicKey: PublicKey | null = null;
  if (accounts?.[0]) {
    try {
      userPublicKey = new PublicKey(accounts[0]);
    } catch {
      userPublicKey = null;
    }
  }

  return (
    <JupiterContext.Provider
      value={{
        jupiterApi,
        connection: jupiterConnection,
        userPublicKey,
      }}
    >
      {children}
    </JupiterContext.Provider>
  );
};

// Custom hook to use Jupiter API
export const useJupiter = () => {
  const context = useContext(JupiterContext);
  if (!context) {
    throw new Error("useJupiter must be used within JupiterProvider");
  }
  return context;
};

export default JupiterProvider;
