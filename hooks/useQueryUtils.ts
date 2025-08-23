"use client";

import { QueryClient } from "@tanstack/react-query";

// Query key factories for consistent key management
export const queryKeys = {
  // Balance keys
  balance: (userAddress: string, tokenMint?: string) => [
    "balance",
    userAddress,
    tokenMint,
  ],

  // Wallet data keys
  walletData: (walletAddress: string) => ["walletData", walletAddress],
  walletTokens: (walletAddress: string) => ["walletTokens", walletAddress],
  walletNFTs: (walletAddress: string) => ["walletNFTs", walletAddress],
  walletNativeBalance: (walletAddress: string) => [
    "walletNativeBalance",
    walletAddress,
  ],

  // Market data keys
  solanaMarketData: (perPage: number = 50) => ["solanaMarketData", perPage],
  coinData: (coinId: string) => ["coinData", coinId],
  tokenPrices: (tokenAddresses: string[]) => [
    "tokenPrices",
    tokenAddresses.sort(),
  ],
  tokenPrice: (tokenAddress: string) => ["tokenPrice", tokenAddress],
  marketAnalytics: () => ["marketAnalytics"],
  topGainers: (limit: number = 5) => ["topGainers", limit],
  topLosers: (limit: number = 5) => ["topLosers", limit],
  marketSearch: (searchQuery: string) => ["marketSearch", searchQuery],

  // Transaction data keys
  transactionData: (walletAddress: string, limit: number = 25) => [
    "transactionData",
    walletAddress,
    limit,
  ],
  processedTransactions: (walletAddress: string, limit: number = 25) => [
    "processedTransactions",
    walletAddress,
    limit,
  ],
  transactionAnalytics: (walletAddress: string, limit: number = 100) => [
    "transactionAnalytics",
    walletAddress,
    limit,
  ],
  filteredTransactions: (walletAddress: string, filter: any) => [
    "filteredTransactions",
    walletAddress,
    filter,
  ],

  // Payment/Solana Pay keys
  paymentStatus: (reference: string) => ["paymentStatus", reference],
  paymentHistory: () => ["paymentHistory"],
  paymentCacheStats: () => ["paymentCacheStats"],

  // Data fetching keys (legacy support)
  data: (dataId: string) => ["data", dataId],
  portfolio: (dataId: string) => ["portfolio", dataId],
  transactions: (dataId: string) => ["transactions", dataId],
  market: (dataId: string) => ["market", dataId],
  nfts: (dataId: string) => ["nfts", dataId],
} as const;

// Common stale times for different data types
export const staleTimes = {
  realtime: 0, // For live data like payment status
  fast: 30 * 1000, // 30 seconds - for balances, prices
  medium: 2 * 60 * 1000, // 2 minutes - for market data, transactions
  slow: 5 * 60 * 1000, // 5 minutes - for analytics, NFTs
  static: 10 * 60 * 1000, // 10 minutes - for relatively static data
} as const;

// Common garbage collection times
export const gcTimes = {
  short: 1 * 60 * 1000, // 1 minute
  medium: 5 * 60 * 1000, // 5 minutes
  long: 10 * 60 * 1000, // 10 minutes
  persistent: 30 * 60 * 1000, // 30 minutes
} as const;

// Error handling utilities
export const retryConditions = {
  noRetryOn4xx: (failureCount: number, error: unknown) => {
    // Don't retry on 4xx errors (client errors)
    if (error instanceof Error && error.message.includes("400")) return false;
    if (error instanceof Error && error.message.includes("401")) return false;
    if (error instanceof Error && error.message.includes("403")) return false;
    if (error instanceof Error && error.message.includes("404")) return false;
    return failureCount < 2;
  },

  noRetryOnInvalidAddress: (failureCount: number, error: unknown) => {
    if (
      error instanceof Error &&
      error.message.includes("Invalid wallet address")
    )
      return false;
    if (error instanceof Error && error.message.includes("Invalid public key"))
      return false;
    return failureCount < 2;
  },

  conservativeRetry: (failureCount: number, error: unknown) => {
    return failureCount < 1; // Only retry once
  },

  aggressiveRetry: (failureCount: number, error: unknown) => {
    return failureCount < 3; // Retry up to 3 times
  },
} as const;

// Utility functions for cache management
export class QueryUtils {
  private queryClient: QueryClient;

  constructor(queryClient: QueryClient) {
    this.queryClient = queryClient;
  }

  // Invalidate all wallet-related data
  invalidateWalletData(walletAddress: string) {
    this.queryClient.invalidateQueries({
      queryKey: queryKeys.walletData(walletAddress),
    });
    this.queryClient.invalidateQueries({
      queryKey: queryKeys.walletTokens(walletAddress),
    });
    this.queryClient.invalidateQueries({
      queryKey: queryKeys.walletNFTs(walletAddress),
    });
    this.queryClient.invalidateQueries({
      queryKey: queryKeys.walletNativeBalance(walletAddress),
    });
    this.queryClient.invalidateQueries({
      queryKey: queryKeys.balance(walletAddress),
    });
  }

  // Invalidate all market data
  invalidateMarketData() {
    this.queryClient.invalidateQueries({
      queryKey: ["solanaMarketData"],
    });
    this.queryClient.invalidateQueries({
      queryKey: ["marketAnalytics"],
    });
    this.queryClient.invalidateQueries({
      queryKey: ["topGainers"],
    });
    this.queryClient.invalidateQueries({
      queryKey: ["topLosers"],
    });
    this.queryClient.invalidateQueries({
      queryKey: ["tokenPrices"],
    });
  }

  // Invalidate all transaction data
  invalidateTransactionData(walletAddress: string) {
    this.queryClient.invalidateQueries({
      queryKey: queryKeys.transactionData(walletAddress, 25),
    });
    this.queryClient.invalidateQueries({
      queryKey: queryKeys.processedTransactions(walletAddress, 25),
    });
    this.queryClient.invalidateQueries({
      queryKey: queryKeys.transactionAnalytics(walletAddress, 100),
    });
  }

  // Prefetch commonly needed data
  async prefetchEssentialData(walletAddress: string) {
    // Prefetch wallet balance
    await this.queryClient.prefetchQuery({
      queryKey: queryKeys.balance(walletAddress),
      staleTime: staleTimes.fast,
    });

    // Prefetch market data
    await this.queryClient.prefetchQuery({
      queryKey: queryKeys.solanaMarketData(),
      staleTime: staleTimes.medium,
    });

    // Prefetch recent transactions
    await this.queryClient.prefetchQuery({
      queryKey: queryKeys.processedTransactions(walletAddress),
      staleTime: staleTimes.medium,
    });
  }

  // Clear all cached data
  clearAllCaches() {
    this.queryClient.clear();
  }

  // Get cache statistics
  getCacheStats() {
    const queryCache = this.queryClient.getQueryCache();
    const queries = queryCache.getAll();

    return {
      totalQueries: queries.length,
      activeQueries: queries.filter((q) => q.getObserversCount() > 0).length,
      staleQueries: queries.filter((q) => q.isStale()).length,
      errorQueries: queries.filter((q) => q.state.status === "error").length,
    };
  }

  // Optimistic updates for balance changes
  optimisticBalanceUpdate(
    walletAddress: string,
    tokenMint: string | undefined,
    newBalance: string
  ) {
    this.queryClient.setQueryData(
      queryKeys.balance(walletAddress, tokenMint),
      newBalance
    );
  }

  // Batch invalidate related queries after a transaction
  invalidateAfterTransaction(walletAddress: string) {
    // Invalidate balance
    this.queryClient.invalidateQueries({
      queryKey: queryKeys.balance(walletAddress),
    });

    // Invalidate wallet data
    this.invalidateWalletData(walletAddress);

    // Invalidate transaction data
    this.invalidateTransactionData(walletAddress);
  }

  // Remove specific queries from cache
  removeQuery(queryKey: unknown[]) {
    this.queryClient.removeQueries({ queryKey });
  }

  // Set default options for specific query types
  setWalletQueryDefaults() {
    this.queryClient.setQueryDefaults(["walletData"], {
      staleTime: staleTimes.medium,
      gcTime: gcTimes.medium,
      retry: retryConditions.noRetryOnInvalidAddress,
    });

    this.queryClient.setQueryDefaults(["balance"], {
      staleTime: staleTimes.fast,
      gcTime: gcTimes.short,
      retry: retryConditions.noRetryOnInvalidAddress,
    });

    this.queryClient.setQueryDefaults(["tokenPrices"], {
      staleTime: staleTimes.fast,
      gcTime: gcTimes.medium,
      retry: retryConditions.conservativeRetry,
    });
  }
}

// React hook to get QueryUtils instance
export function useQueryUtils(queryClient: QueryClient) {
  return React.useMemo(() => new QueryUtils(queryClient), [queryClient]);
}

// Background sync utility
export function createBackgroundSync(queryClient: QueryClient) {
  return {
    // Start syncing wallet data for active wallets
    startWalletSync(
      walletAddresses: string[],
      interval: number = 2 * 60 * 1000
    ) {
      return setInterval(() => {
        walletAddresses.forEach((address) => {
          queryClient.invalidateQueries({
            queryKey: queryKeys.walletData(address),
          });
          queryClient.invalidateQueries({
            queryKey: queryKeys.balance(address),
          });
        });
      }, interval);
    },

    // Start syncing market data
    startMarketSync(interval: number = 5 * 60 * 1000) {
      return setInterval(() => {
        queryClient.invalidateQueries({
          queryKey: ["solanaMarketData"],
        });
        queryClient.invalidateQueries({
          queryKey: ["tokenPrices"],
        });
      }, interval);
    },

    // Stop sync
    stopSync(intervalId: NodeJS.Timeout) {
      clearInterval(intervalId);
    },
  };
}

// Development utilities
export const devTools = {
  // Log all queries and their states
  logQueryStates(queryClient: QueryClient) {
    const queries = queryClient.getQueryCache().getAll();
    console.table(
      queries.map((query) => ({
        key: JSON.stringify(query.queryKey),
        status: query.state.status,
        dataUpdatedAt: new Date(query.state.dataUpdatedAt),
        error: query.state.error?.message,
        observers: query.getObserversCount(),
      }))
    );
  },

  // Get detailed cache information
  getCacheInfo(queryClient: QueryClient) {
    const queryCache = queryClient.getQueryCache();
    const mutationCache = queryClient.getMutationCache();

    return {
      queries: {
        total: queryCache.getAll().length,
        byStatus: queryCache.getAll().reduce((acc, query) => {
          acc[query.state.status] = (acc[query.state.status] || 0) + 1;
          return acc;
        }, {} as Record<string, number>),
      },
      mutations: {
        total: mutationCache.getAll().length,
      },
      memory: {
        // Estimate memory usage (rough calculation)
        estimatedSize: JSON.stringify(
          queryCache.getAll().map((q) => q.state.data)
        ).length,
      },
    };
  },
};

// Export React import for use in hooks
import React from "react";
