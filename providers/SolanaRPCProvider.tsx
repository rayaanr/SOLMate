"use client";

import { Connection } from "@solana/web3.js";
import { createContext, useContext, ReactNode, useMemo } from "react";

interface SolanaRPCContextType {
  connection: Connection;
  rpcUrl: string;
}

const SolanaRPCContext = createContext<SolanaRPCContextType | null>(null);

interface SolanaRPCProviderProps {
  children: ReactNode;
  rpcUrl?: string;
  commitment?: "processed" | "confirmed" | "finalized";
}

/**
 * Provides a centralized Solana RPC connection throughout the app
 */
export function SolanaRPCProvider({
  children,
  rpcUrl: customRpcUrl,
  commitment = "confirmed",
}: SolanaRPCProviderProps) {
  const rpcUrl = useMemo(() => {
    return (
      customRpcUrl ||
      process.env.NEXT_PUBLIC_HELIUS_RPC_URL ||
      "https://api.mainnet-beta.solana.com"
    );
  }, [customRpcUrl]);

  const connection = useMemo(() => {
    return new Connection(rpcUrl, commitment);
  }, [rpcUrl, commitment]);

  const value = useMemo(() => ({
    connection,
    rpcUrl,
  }), [connection, rpcUrl]);

  return (
    <SolanaRPCContext.Provider value={value}>
      {children}
    </SolanaRPCContext.Provider>
  );
}

/**
 * Custom hook to access the Solana RPC connection
 * @throws Error if used outside of SolanaRPCProvider
 */
export function useSolanaRPC(): SolanaRPCContextType {
  const context = useContext(SolanaRPCContext);
  
  if (!context) {
    throw new Error(
      "useSolanaRPC must be used within a SolanaRPCProvider. " +
      "Make sure to wrap your app with <SolanaRPCProvider>."
    );
  }
  
  return context;
}

/**
 * Hook that provides just the connection instance for convenience
 */
export function useSolanaConnection(): Connection {
  return useSolanaRPC().connection;
}
