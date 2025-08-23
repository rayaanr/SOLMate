"use client";

import React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchWalletData,
} from "@/services/wallet/wallet-data";

// Custom hook for wallet data with TanStack Query
export function useWalletData(walletAddress?: string) {
  return useQuery({
    queryKey: ["walletData", walletAddress],
    queryFn: () => fetchWalletData(walletAddress),
    enabled: !!walletAddress,
    staleTime: 1 * 60 * 1000, // 1 minute
    gcTime: 5 * 60 * 1000, // 5 minutes
    retry: (failureCount, error) => {
      // Don't retry on invalid wallet address
      if (error?.message?.includes("Invalid wallet address")) return false;
      return failureCount < 2;
    },
  });
}

// Hook for portfolio tokens specifically
export function useWalletTokens(walletAddress?: string) {
  return useQuery({
    queryKey: ["walletTokens", walletAddress],
    queryFn: async () => {
      const data = await fetchWalletData(walletAddress);
      return {
        tokens: data.tokens || [],
        totalValue:
          data.tokens?.reduce(
            (sum, token) => sum + parseFloat(token.usd_value || "0"),
            0
          ) || 0,
      };
    },
    enabled: !!walletAddress,
    staleTime: 1 * 60 * 1000, // 1 minute
    select: (data) => ({
      tokens: data.tokens,
      totalValue: data.totalValue,
    }),
  });
}

// Hook for wallet NFTs specifically
export function useWalletNFTs(walletAddress?: string) {
  return useQuery({
    queryKey: ["walletNFTs", walletAddress],
    queryFn: async () => {
      const data = await fetchWalletData(walletAddress);
      return data.nfts || [];
    },
    enabled: !!walletAddress,
    staleTime: 5 * 60 * 1000, // 5 minutes for NFTs
  });
}

// Hook for native SOL balance specifically
export function useWalletNativeBalance(walletAddress?: string) {
  return useQuery({
    queryKey: ["walletNativeBalance", walletAddress],
    queryFn: async () => {
      const data = await fetchWalletData(walletAddress);
      return data.native_balance;
    },
    enabled: !!walletAddress,
    staleTime: 30 * 1000, // 30 seconds for balance
    select: (data) => ({
      solana: data?.solana || "0",
      usd_value: data?.usd_value || "0",
      solBalance: parseFloat(data?.solana || "0"),
      usdValue: parseFloat(data?.usd_value || "0"),
    }),
  });
}

// Prefetch utility for wallet data
export function usePrefetchWalletData() {
  const queryClient = useQueryClient();

  const prefetchWalletData = async (walletAddress: string) => {
    await queryClient.prefetchQuery({
      queryKey: ["walletData", walletAddress],
      queryFn: () => fetchWalletData(walletAddress),
      staleTime: 1 * 60 * 1000,
    });
  };

  return { prefetchWalletData };
}

// Background refresh utility for wallet data
export function useWalletDataRefresh(
  walletAddresses: string[],
  interval: number = 2 * 60 * 1000
) {
  const queryClient = useQueryClient();

  React.useEffect(() => {
    if (walletAddresses.length === 0) return;

    const refreshInterval = setInterval(() => {
      walletAddresses.forEach((address) => {
        queryClient.invalidateQueries({ queryKey: ["walletData", address] });
        queryClient.invalidateQueries({ queryKey: ["walletTokens", address] });
        queryClient.invalidateQueries({ queryKey: ["walletNFTs", address] });
        queryClient.invalidateQueries({
          queryKey: ["walletNativeBalance", address],
        });
      });
    }, interval);

    return () => clearInterval(refreshInterval);
  }, [walletAddresses, interval, queryClient]);
}

// Mutation hook for wallet-related actions (if needed)
export function useWalletMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      action,
      walletAddress,
      data,
    }: {
      action: "refresh" | "update";
      walletAddress: string;
      data?: any;
    }) => {
      if (action === "refresh") {
        return await fetchWalletData(walletAddress);
      }
      // Add other wallet actions as needed
      throw new Error(`Unsupported action: ${action}`);
    },
    onSuccess: (data, variables) => {
      // Invalidate related queries
      queryClient.invalidateQueries({
        queryKey: ["walletData", variables.walletAddress],
      });
      queryClient.invalidateQueries({
        queryKey: ["walletTokens", variables.walletAddress],
      });
      queryClient.invalidateQueries({
        queryKey: ["walletNFTs", variables.walletAddress],
      });
      queryClient.invalidateQueries({
        queryKey: ["walletNativeBalance", variables.walletAddress],
      });
    },
    onError: (error) => {
      console.error("Wallet mutation error:", error);
    },
  });
}
