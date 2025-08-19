"use client";

import React from 'react';
import { useDataFetch } from '@/hooks/useDataFetch';
import { MessageNFTGrid } from '../nfts/MessageNFTGrid';

interface OptimizedMessageNFTGridProps {
  dataId: string;
}

export function OptimizedMessageNFTGrid({ dataId }: OptimizedMessageNFTGridProps) {
  const { data, loading, error } = useDataFetch(dataId);

  if (loading) {
    return (
      <div className="mt-4">
        <div className="animate-pulse flex items-center gap-3 p-3 bg-purple-50 rounded-lg border border-purple-200">
          <div className="w-5 h-5 bg-purple-400 rounded-full"></div>
          <div className="flex-1">
            <div className="h-4 bg-purple-200 rounded w-40 mb-1"></div>
            <div className="h-3 bg-purple-100 rounded w-56"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
        <p className="text-red-600 text-sm">Failed to load NFT data: {error}</p>
      </div>
    );
  }

  if (!data) {
    return null;
  }

  // Use the existing MessageNFTGrid component with fetched data
  return <MessageNFTGrid nfts={data.nfts} />;
}
