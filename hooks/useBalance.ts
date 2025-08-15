import { useState, useEffect, useCallback } from 'react';
import { PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { getAssociatedTokenAddress } from '@solana/spl-token';
import { useSolanaConnection } from '@/providers/SolanaRPCProvider';

interface UseBalanceParams {
  userAddress?: string;
  tokenMint?: string;
  tokenDecimals?: number;
}

interface UseBalanceReturn {
  balance: string;
  isLoading: boolean;
  error: string | null;
  refreshBalance: () => Promise<void>;
}

const getTokenAmountString = (accountData: any): string => {
  return accountData?.data?.parsed?.info?.tokenAmount?.uiAmountString ?? "0";
};

export function useBalance({ userAddress, tokenMint, tokenDecimals }: UseBalanceParams): UseBalanceReturn {
  const [balance, setBalance] = useState<string>("0");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Use centralized RPC connection
  const connection = useSolanaConnection();

  // Memoize the refresh function to prevent unnecessary re-renders
  const refreshBalance = useCallback(async () => {
    if (!userAddress) return;

    setIsLoading(true);
    setError(null);

    try {
      const userPubkey = new PublicKey(userAddress);

      if (!tokenMint) {
        // SOL balance
        const balance = await connection.getBalance(userPubkey);
        setBalance((balance / LAMPORTS_PER_SOL).toString());
      } else {
        // Token balance
        const mintKey = new PublicKey(tokenMint);
        const ata = await getAssociatedTokenAddress(mintKey, userPubkey);
        const info = await connection.getParsedAccountInfo(ata);
        setBalance(info.value ? getTokenAmountString(info.value) : "0");
      }
    } catch (err) {
      console.error('Error fetching balance:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch balance');
      setBalance("0");
    } finally {
      setIsLoading(false);
    }
  }, [userAddress, tokenMint, connection]);

  // Effect to fetch balance when dependencies change
  useEffect(() => {
    refreshBalance();
  }, [refreshBalance]);

  return {
    balance,
    isLoading,
    error,
    refreshBalance,
  };
}
