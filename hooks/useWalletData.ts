import { useQuery, useQueryClient } from '@tanstack/react-query';
import { TokenData } from '@/services/wallet/wallet-data';

// Response type from our /api/wallet-data endpoint
export interface WalletDataResponse {
  walletAddress: string;
  native_balance: {
    solana: string;
    usd_value: string;
  };
  tokens: TokenData[];
  updatedAt: string;
}

const fetchWalletData = async (walletAddress?: string): Promise<WalletDataResponse> => {
  const url = walletAddress ? `/api/wallet-data?address=${walletAddress}` : '/api/wallet-data';
  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
};

export function useWalletData(walletAddress?: string) {
  return useQuery({
    queryKey: ['wallet-data', walletAddress || 'default'],
    queryFn: () => fetchWalletData(walletAddress),
    staleTime: 30_000,      // aligns with server TTL
    gcTime: 5 * 60_000,
    refetchOnWindowFocus: false,
    retry: 2,
    placeholderData: (prev) => prev, // keep previous data while refetching
  });
}

export function useWalletDataActions() {
  const qc = useQueryClient();
  return {
    refresh: (walletAddress?: string) =>
      qc.invalidateQueries({ queryKey: ['wallet-data', walletAddress || 'default'] }),
    refreshAll: () =>
      qc.invalidateQueries({ queryKey: ['wallet-data'] }),
  };
}
