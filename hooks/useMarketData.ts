"use client";

import React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchSolanaMarketData } from "@/services/market/market-data";
import {
  fetchTokenPrices,
  fetchTokenPrice,
  clearTokenPriceCache,
} from "@/services/market/moralis-price-service";
import type {
  CoinMarketData,
} from "@/types/market";

// Hook for Solana ecosystem market data
export function useMarketData(perPage: number = 50) {
  return useQuery({
    queryKey: ["solanaMarketData", perPage],
    queryFn: () => fetchSolanaMarketData(perPage),
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    retry: 2,
  });
}

// Hook for specific coin data by ID or symbol
export function useCoinData(coinId: string) {
  return useQuery({
    queryKey: ["coinData", coinId],
    queryFn: async (): Promise<CoinMarketData | null> => {
      const marketData = await fetchSolanaMarketData();
      return (
        marketData.data.find(
          (coin) =>
            coin.id === coinId ||
            coin.symbol.toLowerCase() === coinId.toLowerCase()
        ) || null
      );
    },
    enabled: !!coinId,
    staleTime: 2 * 60 * 1000,
  });
}

// Hook for token prices from Moralis
export function useTokenPrices(tokenAddresses: string[]) {
  return useQuery({
    queryKey: ["tokenPrices", tokenAddresses.sort()],
    queryFn: () => fetchTokenPrices(tokenAddresses),
    enabled: tokenAddresses.length > 0,
    staleTime: 1 * 60 * 1000, // 1 minute for price data
    gcTime: 5 * 60 * 1000, // 5 minutes
    retry: 1,
  });
}

// Hook for single token price
export function useTokenPrice(tokenAddress: string) {
  return useQuery({
    queryKey: ["tokenPrice", tokenAddress],
    queryFn: () => fetchTokenPrice(tokenAddress),
    enabled: !!tokenAddress,
    staleTime: 1 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
  });
}

// Hook for market analytics only
export function useMarketAnalytics() {
  return useQuery({
    queryKey: ["marketAnalytics"],
    queryFn: async () => {
      const marketData = await fetchSolanaMarketData();
      return marketData.analytics;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes for analytics
    select: (analytics) => ({
      topGainers: analytics.topGainers,
      topLosers: analytics.topLosers,
      totalMarketCap: analytics.totalMarketCap,
      totalVolume: analytics.totalVolume,
      averageChange24h: analytics.averageChange24h,
      marketSummary: analytics.marketSummary,
    }),
  });
}

// Hook for top gainers
export function useTopGainers(limit: number = 5) {
  return useQuery({
    queryKey: ["topGainers", limit],
    queryFn: async (): Promise<CoinMarketData[]> => {
      const marketData = await fetchSolanaMarketData();
      return marketData.analytics.topGainers.slice(0, limit);
    },
    staleTime: 2 * 60 * 1000,
  });
}

// Hook for top losers
export function useTopLosers(limit: number = 5) {
  return useQuery({
    queryKey: ["topLosers", limit],
    queryFn: async (): Promise<CoinMarketData[]> => {
      const marketData = await fetchSolanaMarketData();
      return marketData.analytics.topLosers.slice(0, limit);
    },
    staleTime: 2 * 60 * 1000,
  });
}

// Hook for market search/filtering
export function useMarketSearch(searchQuery: string) {
  return useQuery({
    queryKey: ["marketSearch", searchQuery],
    queryFn: async (): Promise<CoinMarketData[]> => {
      if (!searchQuery || searchQuery.length < 2) return [];

      const marketData = await fetchSolanaMarketData();
      return marketData.data.filter(
        (coin) =>
          coin.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          coin.symbol.toLowerCase().includes(searchQuery.toLowerCase())
      );
    },
    enabled: !!searchQuery && searchQuery.length >= 2,
    staleTime: 2 * 60 * 1000,
  });
}

// Prefetch utility for market data
export function usePrefetchMarketData() {
  const queryClient = useQueryClient();

  const prefetchMarketData = async (perPage: number = 50) => {
    await queryClient.prefetchQuery({
      queryKey: ["solanaMarketData", perPage],
      queryFn: () => fetchSolanaMarketData(perPage),
      staleTime: 2 * 60 * 1000,
    });
  };

  const prefetchTokenPrices = async (tokenAddresses: string[]) => {
    await queryClient.prefetchQuery({
      queryKey: ["tokenPrices", tokenAddresses.sort()],
      queryFn: () => fetchTokenPrices(tokenAddresses),
      staleTime: 1 * 60 * 1000,
    });
  };

  return { prefetchMarketData, prefetchTokenPrices };
}

// Background refresh utility for market data
export function useMarketDataRefresh(interval: number = 2 * 60 * 1000) {
  const queryClient = useQueryClient();

  React.useEffect(() => {
    const refreshInterval = setInterval(() => {
      queryClient.invalidateQueries({ queryKey: ["solanaMarketData"] });
      queryClient.invalidateQueries({ queryKey: ["marketAnalytics"] });
      queryClient.invalidateQueries({ queryKey: ["topGainers"] });
      queryClient.invalidateQueries({ queryKey: ["topLosers"] });
      queryClient.invalidateQueries({ queryKey: ["tokenPrices"] });
    }, interval);

    return () => clearInterval(refreshInterval);
  }, [interval, queryClient]);
}

// Mutation hook for market-related actions
export function useMarketMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      action,
      data,
    }: {
      action: "clearTokenPriceCache" | "refreshMarketData";
      data?: any;
    }) => {
      if (action === "clearTokenPriceCache") {
        clearTokenPriceCache();
        return { success: true };
      } else if (action === "refreshMarketData") {
        return await fetchSolanaMarketData(data?.perPage || 50);
      }
      throw new Error(`Unsupported action: ${action}`);
    },
    onSuccess: (data, variables) => {
      if (variables.action === "clearTokenPriceCache") {
        queryClient.invalidateQueries({ queryKey: ["tokenPrices"] });
        queryClient.invalidateQueries({ queryKey: ["tokenPrice"] });
      } else if (variables.action === "refreshMarketData") {
        queryClient.invalidateQueries({ queryKey: ["solanaMarketData"] });
        queryClient.invalidateQueries({ queryKey: ["marketAnalytics"] });
      }
    },
    onError: (error) => {
      console.error("Market mutation error:", error);
    },
  });
}

// Hook for live price updates (optional - for real-time features)
export function useLivePriceUpdates(
  tokenAddresses: string[],
  enabled: boolean = false
) {
  return useQuery({
    queryKey: ["livePrices", tokenAddresses.sort()],
    queryFn: () => fetchTokenPrices(tokenAddresses),
    enabled: enabled && tokenAddresses.length > 0,
    refetchInterval: 30 * 1000, // 30 seconds for live updates
    staleTime: 0, // Always considered stale for live updates
    gcTime: 1 * 60 * 1000, // 1 minute cache
  });
}
