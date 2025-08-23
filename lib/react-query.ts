"use client";

import { QueryClient } from "@tanstack/react-query";

// Create a QueryClient with performance-optimized defaults
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Prevent refetch storms during table interactions
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
      refetchOnMount: false,
      
      // Conservative retry strategy
      retry: 1,
      
      // Memory management
      gcTime: 5 * 60 * 1000, // 5 minutes garbage collection
      staleTime: 2 * 60 * 1000, // 2 minutes stale time
      
      // Keep previous data during refetches for smoother UX
      placeholderData: (previousData: any) => previousData,
      
      // Reduce automatic refetch intervals
      refetchInterval: false, // Disable automatic background refetching
      
      // Network mode settings
      networkMode: 'online',
    },
    mutations: {
      // Mutation defaults
      retry: 1,
      networkMode: 'online',
    },
  },
});

// Helper to configure different query behavior for different data types
export const queryDefaults = {
  // Real-time data (balances, payment status)
  realtime: {
    staleTime: 0,
    gcTime: 1 * 60 * 1000, // 1 minute
    refetchInterval: 5000, // 5 seconds
  },
  
  // Fast-changing data (prices, market data)
  fast: {
    staleTime: 30 * 1000, // 30 seconds
    gcTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: false, // Manual refetch only
  },
  
  // Medium-changing data (transactions, portfolio)
  medium: {
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    refetchInterval: false,
  },
  
  // Slow-changing data (analytics, historical data)
  slow: {
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
    refetchInterval: false,
  },
};

// Performance monitoring utilities
export const queryPerformance = {
  // Log query performance issues
  logSlowQueries: (threshold: number = 1000) => {
    const cache = queryClient.getQueryCache();
    cache.subscribe((event) => {
      if (event?.type === 'updated' && event.action?.type === 'success') {
        const duration = Date.now() - (event.query.state.dataUpdatedAt || 0);
        if (duration > threshold) {
          console.warn(`Slow query detected: ${JSON.stringify(event.query.queryKey)}, Duration: ${duration}ms`);
        }
      }
    });
  },
  
  // Get cache statistics
  getCacheStats: () => {
    const cache = queryClient.getQueryCache();
    const queries = cache.getAll();
    
    return {
      total: queries.length,
      active: queries.filter(q => q.getObserversCount() > 0).length,
      stale: queries.filter(q => q.isStale()).length,
      error: queries.filter(q => q.state.status === 'error').length,
      loading: queries.filter(q => q.state.status === 'pending').length,
    };
  },
  
  // Clear problematic queries
  clearErrorQueries: () => {
    const cache = queryClient.getQueryCache();
    const errorQueries = cache.getAll().filter(q => q.state.status === 'error');
    errorQueries.forEach(query => {
      queryClient.removeQueries({ queryKey: query.queryKey });
    });
  },
};

// Development helpers
if (process.env.NODE_ENV === 'development') {
  // Enable query performance monitoring in development
  queryPerformance.logSlowQueries(500);
  
  // Log cache statistics periodically
  setInterval(() => {
    const stats = queryPerformance.getCacheStats();
    if (stats.total > 50 || stats.error > 0) {
      console.log('ReactQuery Cache Stats:', stats);
    }
  }, 30000); // Every 30 seconds
}
