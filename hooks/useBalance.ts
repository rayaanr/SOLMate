import { PublicKey, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { getAssociatedTokenAddress } from "@solana/spl-token";
import { useSolanaConnection } from "@/providers/SolanaRPCProvider";
import { useQuery, useQueryClient } from "@tanstack/react-query";

interface UseBalanceParams {
  userAddress?: string;
  tokenMint?: string;
  tokenDecimals?: number;
}

interface UseBalanceReturn {
  balance: string;
  isLoading: boolean;
  error: Error | null;
  refreshBalance: () => Promise<void>;
}

const getTokenAmountString = (accountData: any): string => {
  return accountData?.data?.parsed?.info?.tokenAmount?.uiAmountString ?? "0";
};

// Balance fetching function for TanStack Query
async function fetchBalance(
  userAddress: string,
  tokenMint: string | undefined,
  connection: any
): Promise<string> {
  const userPubkey = new PublicKey(userAddress);

  if (!tokenMint) {
    // SOL balance
    const balance = await connection.getBalance(userPubkey);
    return (balance / LAMPORTS_PER_SOL).toString();
  } else {
    // Token balance
    const mintKey = new PublicKey(tokenMint);
    const ata = await getAssociatedTokenAddress(mintKey, userPubkey);
    const info = await connection.getParsedAccountInfo(ata);
    return info.value ? getTokenAmountString(info.value) : "0";
  }
}

export function useBalance({
  userAddress,
  tokenMint,
  tokenDecimals,
}: UseBalanceParams): UseBalanceReturn {
  const connection = useSolanaConnection();
  const queryClient = useQueryClient();

  const {
    data: balance = "0",
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["balance", userAddress, tokenMint],
    queryFn: () => fetchBalance(userAddress!, tokenMint, connection),
    enabled: !!userAddress,
    staleTime: 30 * 1000, // 30 seconds
    gcTime: 2 * 60 * 1000, // 2 minutes
    retry: (failureCount, error) => {
      // Don't retry on invalid address errors
      if (error?.message?.includes("Invalid public key")) return false;
      return failureCount < 2;
    },
  });

  const refreshBalance = async () => {
    await refetch();
  };

  return {
    balance,
    isLoading,
    error,
    refreshBalance,
  };
}
