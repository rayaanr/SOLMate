"use client";

import React from "react";
import {
  useQuery,
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import {
  queryKeys,
  staleTimes,
  gcTimes,
  retryConditions,
} from "./useQueryUtils";

// Data fetching function with proper error handling
async function fetchData(dataId: string) {
  const response = await fetch(`/api/data/${dataId}`);
  if (!response.ok) {
    // Create a more specific error that includes status code
    const error = new Error(`HTTP ${response.status}: ${response.statusText}`);
    // Add status to error for retry condition checking
    (error as any).status = response.status;
    throw error;
  }
  return response.json();
}

// Enhanced data fetch hook with TanStack Query and proper error handling
export function useOptimizedDataFetch(dataId: string | null) {
  return useQuery({
    queryKey: queryKeys.data(dataId!),
    queryFn: () => fetchData(dataId!),
    enabled: !!dataId,
    staleTime: staleTimes.medium,
    gcTime: gcTimes.medium,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchOnMount: false,
    retry: (failureCount, error: any) => {
      // Don't retry on 4xx errors (client errors like 404, 400, etc.)
      if (error?.status >= 400 && error?.status < 500) {
        return false;
      }
      // Only retry once for other errors
      return failureCount < 1;
    },
  });
}

// Portfolio data hook with specific typing
export function usePortfolioData(dataId: string | null) {
  return useQuery({
    queryKey: queryKeys.portfolio(dataId!),
    queryFn: () => fetchData(dataId!),
    enabled: !!dataId,
    staleTime: staleTimes.medium,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    placeholderData: (prev) => prev,
    select: (data) => ({
      tokens: data.tokens || [],
      native_balance: data.native_balance || { solana: "0", usd_value: "0" },
      totalValue:
        data.tokens?.reduce(
          (sum: number, token: any) => sum + parseFloat(token.usd_value || "0"),
          0
        ) || 0,
    }),
  });
}

// Transaction data hook with specific typing and proper error handling
export function useTransactionData(dataId: string | null) {
  return useQuery({
    queryKey: queryKeys.transactions(dataId!),
    queryFn: () => fetchData(dataId!),
    enabled: !!dataId,
    staleTime: staleTimes.fast,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchOnMount: false,
    placeholderData: (prev) => prev,
    retry: (failureCount, error: any) => {
      // Don't retry on 4xx errors (client errors like 404, 400, etc.)
      if (error?.status >= 400 && error?.status < 500) {
        console.log(`Not retrying ${error?.status} error for dataId: ${dataId}`);
        return false;
      }
      // Only retry once for other errors
      return failureCount < 1;
    },
    select: (data) => ({
      transactions: data.transactions || [],
      analytics: data.analytics,
      totalCount: data.transactions?.length || 0,
    }),
  });
}

// Market data hook with specific typing
export function useMarketData(dataId: string | null) {
  return useQuery({
    queryKey: queryKeys.market(dataId!),
    queryFn: () => fetchData(dataId!),
    enabled: !!dataId,
    staleTime: staleTimes.medium,
    select: (data) => ({
      coins: data.coins || [],
      analytics: data.analytics,
      totalCount: data.coins?.length || 0,
    }),
  });
}

// NFT data hook with specific typing
export function useNFTData(dataId: string | null) {
  return useQuery({
    queryKey: queryKeys.nfts(dataId!),
    queryFn: () => fetchData(dataId!),
    enabled: !!dataId,
    staleTime: staleTimes.slow,
    select: (data) => ({
      nfts: data.nfts || [],
      totalCount: data.nfts?.length || 0,
    }),
  });
}

// Infinite query hook for paginated data
export function useInfiniteDataFetch(
  queryKey: string[],
  apiEndpoint: string,
  pageSize: number = 20
) {
  return useInfiniteQuery({
    queryKey,
    queryFn: ({ pageParam = 0 }) =>
      fetch(`${apiEndpoint}?page=${pageParam}&limit=${pageSize}`).then((res) =>
        res.json()
      ),
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => {
      if (lastPage.data?.length < pageSize) return undefined;
      return allPages.length;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// Mutation hook for data updates
export function useDataMutation(onSuccessCallback?: () => void) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      endpoint,
      method,
      data,
    }: {
      endpoint: string;
      method: "POST" | "PUT" | "DELETE";
      data?: any;
    }) => {
      const response = await fetch(endpoint, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: data ? JSON.stringify(data) : undefined,
      });

      if (!response.ok) {
        throw new Error("Failed to update data");
      }

      return response.json();
    },
    onSuccess: (data, variables) => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ["data"] });
      queryClient.invalidateQueries({ queryKey: ["portfolio"] });
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["market"] });
      queryClient.invalidateQueries({ queryKey: ["nfts"] });

      onSuccessCallback?.();
    },
    onError: (error) => {
      console.error("Data mutation error:", error);
    },
  });
}

// Prefetch utility
export function usePrefetchData() {
  const queryClient = useQueryClient();

  const prefetchData = async (
    dataId: string,
    type: "portfolio" | "transactions" | "market" | "nfts" = "portfolio"
  ) => {
    await queryClient.prefetchQuery({
      queryKey: [type, dataId],
      queryFn: () => fetchData(dataId),
      staleTime: 2 * 60 * 1000,
    });
  };

  return { prefetchData };
}

// Background refresh hook
export function useBackgroundRefresh(
  dataIds: string[],
  interval: number = 5 * 60 * 1000
) {
  const queryClient = useQueryClient();

  React.useEffect(() => {
    if (dataIds.length === 0) return;

    const refreshInterval = setInterval(() => {
      dataIds.forEach((dataId) => {
        queryClient.invalidateQueries({ queryKey: ["data", dataId] });
        queryClient.invalidateQueries({ queryKey: ["portfolio", dataId] });
        queryClient.invalidateQueries({ queryKey: ["transactions", dataId] });
        queryClient.invalidateQueries({ queryKey: ["market", dataId] });
        queryClient.invalidateQueries({ queryKey: ["nfts", dataId] });
      });
    }, interval);

    return () => clearInterval(refreshInterval);
  }, [dataIds, interval, queryClient]);
}
