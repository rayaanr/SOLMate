"use client";

import React from 'react';
import { useDataFetch } from '@/hooks/useDataFetch';
import { MessageTransactionTable } from './MessageTransactionTable';

interface OptimizedMessageTransactionTableProps {
  dataId: string;
}

export function OptimizedMessageTransactionTable({ dataId }: OptimizedMessageTransactionTableProps) {
  const { data, loading, error } = useDataFetch(dataId);

  if (loading) {
    return (
      <div className="mt-4">
        <div className="animate-pulse flex items-center gap-3 p-3 bg-green-50 rounded-lg border border-green-200">
          <div className="w-5 h-5 bg-green-400 rounded-full"></div>
          <div className="flex-1">
            <div className="h-4 bg-green-200 rounded w-40 mb-1"></div>
            <div className="h-3 bg-green-100 rounded w-52"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
        <p className="text-red-600 text-sm">Failed to load transaction data: {error}</p>
      </div>
    );
  }

  if (!data) {
    return null;
  }

  // Use the existing MessageTransactionTable component with fetched data
  return <MessageTransactionTable transactions={data.transactions} />;
}
