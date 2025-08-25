"use client";

import React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Connection, PublicKey } from "@solana/web3.js";
import {
  fetchTransactionData,
  processTransactionData,
  analyzeTransactions,
  type ProcessedTransaction,
  type TransactionAnalytics,
} from "@/services/wallet/transaction-data";
import {
  createPaymentRequest,
  createQuickDepositRequest,
  trackPaymentStatus,
  monitorPaymentStatus,
  getAllPaymentRequests,
  clearExpiredPaymentRequests,
  getPaymentCacheStats,
  type PaymentStatus,
} from "@/services/solana-pay/solana-pay-service";

// Hook for fetching transaction data
export function useTransactionData(walletAddress: string, limit: number = 25) {
  return useQuery({
    queryKey: ["transactionData", walletAddress, limit],
    queryFn: () => fetchTransactionData(walletAddress, limit),
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

// Hook for processed transaction data
export function useProcessedTransactions(
  walletAddress: string,
  limit: number = 25
) {
  return useQuery({
    queryKey: ["processedTransactions", walletAddress, limit],
    queryFn: async (): Promise<ProcessedTransaction[]> => {
      const rawTransactions = await fetchTransactionData(walletAddress, limit);
      return processTransactionData(rawTransactions, walletAddress);
    },
    enabled: !!walletAddress,
    staleTime: 1 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
  });
}

// Hook for transaction analytics
export function useTransactionAnalytics(
  walletAddress: string,
  limit: number = 100
) {
  return useQuery({
    queryKey: ["transactionAnalytics", walletAddress, limit],
    queryFn: async (): Promise<TransactionAnalytics> => {
      const rawTransactions = await fetchTransactionData(walletAddress, limit);
      const processedTransactions = processTransactionData(
        rawTransactions,
        walletAddress
      );
      return analyzeTransactions(processedTransactions);
    },
    enabled: !!walletAddress,
    staleTime: 2 * 60 * 1000, // 2 minutes for analytics
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
}

// Hook for Solana Pay payment creation
export function useCreatePayment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createPaymentRequest,
    onSuccess: () => {
      // Invalidate payment history to show new payment
      queryClient.invalidateQueries({ queryKey: ["paymentHistory"] });
    },
    onError: (error) => {
      console.error("Payment creation error:", error);
    },
  });
}

// Hook for quick deposit creation
export function useCreateQuickDeposit() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      recipientAddress,
      amount,
      tokenSymbol,
      label,
    }: {
      recipientAddress: string;
      amount: number;
      tokenSymbol?: string;
      label?: string;
    }) => {
      return await createQuickDepositRequest(
        recipientAddress,
        amount,
        tokenSymbol,
        label
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["paymentHistory"] });
    },
    onError: (error) => {
      console.error("Quick deposit creation error:", error);
    },
  });
}

// Hook for payment status tracking
export function usePaymentStatus(
  connection: Connection,
  reference: PublicKey | null,
  enabled: boolean = true
) {
  return useQuery({
    queryKey: ["paymentStatus", reference?.toBase58()],
    queryFn: () => trackPaymentStatus(connection, reference!),
    enabled: enabled && !!reference,
    refetchInterval: (query) => {
      // Stop polling if payment is confirmed or failed
      const data = query.state.data;
      if (data?.status === "confirmed" || data?.status === "failed") {
        return false;
      }
      return 3000; // Poll every 3 seconds for pending payments
    },
    staleTime: 0, // Always refetch for payment status
    gcTime: 1 * 60 * 1000, // 1 minute cache
  });
}

// Hook for payment history
export function usePaymentHistory() {
  return useQuery({
    queryKey: ["paymentHistory"],
    queryFn: getAllPaymentRequests,
    staleTime: 30 * 1000, // 30 seconds
    gcTime: 5 * 60 * 1000, // 5 minutes
  });
}

// Hook for payment cache statistics
export function usePaymentCacheStats() {
  return useQuery({
    queryKey: ["paymentCacheStats"],
    queryFn: getPaymentCacheStats,
    staleTime: 10 * 1000, // 10 seconds
    gcTime: 1 * 60 * 1000, // 1 minute
  });
}

// Hook for transaction filtering
export function useTransactionFilter(
  walletAddress: string,
  filter: {
    type?: string;
    direction?: "incoming" | "outgoing" | "swap";
    dateRange?: { start: Date; end: Date };
    minAmount?: number;
    maxAmount?: number;
  }
) {
  return useQuery({
    queryKey: ["filteredTransactions", walletAddress, filter],
    queryFn: async (): Promise<ProcessedTransaction[]> => {
      const rawTransactions = await fetchTransactionData(walletAddress, 100);
      const processedTransactions = processTransactionData(
        rawTransactions,
        walletAddress
      );

      return processedTransactions.filter((tx) => {
        if (filter.type && tx.type !== filter.type) return false;
        if (filter.direction && tx.direction !== filter.direction) return false;
        if (filter.dateRange) {
          if (
            tx.date < filter.dateRange.start ||
            tx.date > filter.dateRange.end
          )
            return false;
        }
        if (filter.minAmount && tx.amount < filter.minAmount) return false;
        if (filter.maxAmount && tx.amount > filter.maxAmount) return false;
        return true;
      });
    },
    enabled: !!walletAddress,
    staleTime: 1 * 60 * 1000,
  });
}

// Background refresh utility for transaction data
export function useTransactionDataRefresh(
  walletAddresses: string[],
  interval: number = 2 * 60 * 1000
) {
  const queryClient = useQueryClient();

  React.useEffect(() => {
    if (walletAddresses.length === 0) return;

    const refreshInterval = setInterval(() => {
      walletAddresses.forEach((address) => {
        queryClient.invalidateQueries({
          queryKey: ["transactionData", address],
        });
        queryClient.invalidateQueries({
          queryKey: ["processedTransactions", address],
        });
        queryClient.invalidateQueries({
          queryKey: ["transactionAnalytics", address],
        });
      });
    }, interval);

    return () => clearInterval(refreshInterval);
  }, [walletAddresses, interval, queryClient]);
}

// Hook for payment monitoring with real-time updates
export function usePaymentMonitor(
  connection: Connection,
  reference: PublicKey | null,
  enabled: boolean = true
) {
  const [paymentStatus, setPaymentStatus] =
    React.useState<PaymentStatus | null>(null);
  const queryClient = useQueryClient();

  React.useEffect(() => {
    if (!enabled || !reference) return;

    const stopMonitoring = monitorPaymentStatus(
      connection,
      reference,
      (status) => {
        setPaymentStatus(status);

        // Update the query cache with the latest status
        queryClient.setQueryData(
          ["paymentStatus", reference.toBase58()],
          status
        );

        // If payment is confirmed, invalidate related queries
        if (status.status === "confirmed") {
          queryClient.invalidateQueries({ queryKey: ["paymentHistory"] });
        }
      },
      {
        interval: 3000,
        maxAttempts: 100,
        finality: "confirmed",
      }
    );

    return stopMonitoring;
  }, [connection, reference, enabled, queryClient]);

  return paymentStatus;
}

// Mutation hook for payment management
export function usePaymentMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      action,
      data,
    }: {
      action: "clearExpired" | "refreshHistory";
      data?: any;
    }) => {
      if (action === "clearExpired") {
        return clearExpiredPaymentRequests();
      } else if (action === "refreshHistory") {
        return getAllPaymentRequests();
      }
      throw new Error(`Unsupported action: ${action}`);
    },
    onSuccess: (data, variables) => {
      if (variables.action === "clearExpired") {
        queryClient.invalidateQueries({ queryKey: ["paymentHistory"] });
        queryClient.invalidateQueries({ queryKey: ["paymentCacheStats"] });
      } else if (variables.action === "refreshHistory") {
        queryClient.invalidateQueries({ queryKey: ["paymentHistory"] });
      }
    },
    onError: (error) => {
      console.error("Payment mutation error:", error);
    },
  });
}

// Prefetch utility for transaction data
export function usePrefetchTransactionData() {
  const queryClient = useQueryClient();

  const prefetchTransactionData = async (
    walletAddress: string,
    limit: number = 25
  ) => {
    await queryClient.prefetchQuery({
      queryKey: ["transactionData", walletAddress, limit],
      queryFn: () => fetchTransactionData(walletAddress, limit),
      staleTime: 1 * 60 * 1000,
    });
  };

  const prefetchTransactionAnalytics = async (
    walletAddress: string,
    limit: number = 100
  ) => {
    await queryClient.prefetchQuery({
      queryKey: ["transactionAnalytics", walletAddress, limit],
      queryFn: async () => {
        const rawTransactions = await fetchTransactionData(
          walletAddress,
          limit
        );
        const processedTransactions = processTransactionData(
          rawTransactions,
          walletAddress
        );
        return analyzeTransactions(processedTransactions);
      },
      staleTime: 2 * 60 * 1000,
    });
  };

  return { prefetchTransactionData, prefetchTransactionAnalytics };
}
