"use client";

import React from 'react';
import { useQuery, useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';

// Data fetching function
async function fetchData(dataId: string) {
  const response = await fetch(`/api/data/${dataId}`);
  if (!response.ok) {
    throw new Error('Failed to fetch data');
  }
  return response.json();
}

// Enhanced data fetch hook with TanStack Query
export function useOptimizedDataFetch(dataId: string | null) {
  return useQuery({
    queryKey: ['data', dataId],
    queryFn: () => fetchData(dataId!),
    enabled: !!dataId, // Only run query if dataId exists
    staleTime: 2 * 60 * 1000, // 2 minutes - data specific stale time
    gcTime: 5 * 60 * 1000, // 5 minutes cache time
    retry: (failureCount, error) => {
      // Don't retry on 404s
      if (error?.message?.includes('404')) return false;
      return failureCount < 3;
    },
  });
}

// Portfolio data hook with specific typing
export function usePortfolioData(dataId: string | null) {
  return useQuery({
    queryKey: ['portfolio', dataId],
    queryFn: () => fetchData(dataId!),
    enabled: !!dataId,
    staleTime: 1 * 60 * 1000, // 1 minute for portfolio data
    select: (data) => ({
      tokens: data.tokens || [],
      native_balance: data.native_balance || { solana: '0', usd_value: '0' },
      totalValue: data.tokens?.reduce((sum: number, token: any) => sum + parseFloat(token.usd_value || '0'), 0) || 0,
    }),
  });
}

// Transaction data hook with specific typing
export function useTransactionData(dataId: string | null) {
  return useQuery({
    queryKey: ['transactions', dataId],
    queryFn: () => fetchData(dataId!),
    enabled: !!dataId,
    staleTime: 30 * 1000, // 30 seconds for transaction data
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
    queryKey: ['market', dataId],
    queryFn: () => fetchData(dataId!),
    enabled: !!dataId,
    staleTime: 2 * 60 * 1000, // 2 minutes for market data
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
    queryKey: ['nfts', dataId],
    queryFn: () => fetchData(dataId!),
    enabled: !!dataId,
    staleTime: 5 * 60 * 1000, // 5 minutes for NFT data
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
      fetch(`${apiEndpoint}?page=${pageParam}&limit=${pageSize}`)
        .then(res => res.json()),
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
    mutationFn: async ({ endpoint, method, data }: {
      endpoint: string;
      method: 'POST' | 'PUT' | 'DELETE';
      data?: any;
    }) => {
      const response = await fetch(endpoint, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: data ? JSON.stringify(data) : undefined,
      });

      if (!response.ok) {
        throw new Error('Failed to update data');
      }

      return response.json();
    },
    onSuccess: (data, variables) => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['data'] });
      queryClient.invalidateQueries({ queryKey: ['portfolio'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['market'] });
      queryClient.invalidateQueries({ queryKey: ['nfts'] });
      
      onSuccessCallback?.();
    },
    onError: (error) => {
      console.error('Data mutation error:', error);
    },
  });
}

// Prefetch utility
export function usePrefetchData() {
  const queryClient = useQueryClient();

  const prefetchData = async (dataId: string, type: 'portfolio' | 'transactions' | 'market' | 'nfts' = 'portfolio') => {
    await queryClient.prefetchQuery({
      queryKey: [type, dataId],
      queryFn: () => fetchData(dataId),
      staleTime: 2 * 60 * 1000,
    });
  };

  return { prefetchData };
}

// Background refresh hook
export function useBackgroundRefresh(dataIds: string[], interval: number = 5 * 60 * 1000) {
  const queryClient = useQueryClient();

  React.useEffect(() => {
    if (dataIds.length === 0) return;

    const refreshInterval = setInterval(() => {
      dataIds.forEach(dataId => {
        queryClient.invalidateQueries({ queryKey: ['data', dataId] });
        queryClient.invalidateQueries({ queryKey: ['portfolio', dataId] });
        queryClient.invalidateQueries({ queryKey: ['transactions', dataId] });
        queryClient.invalidateQueries({ queryKey: ['market', dataId] });
        queryClient.invalidateQueries({ queryKey: ['nfts', dataId] });
      });
    }, interval);

    return () => clearInterval(refreshInterval);
  }, [dataIds, interval, queryClient]);
}
