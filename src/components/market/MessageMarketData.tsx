'use client';

import React from 'react';
import { MarketTable } from './MarketTable';
import { CoinMarketData } from '@/src/types/market';

interface MessageMarketDataProps {
  marketData?: {
    coins: CoinMarketData[];
    analytics?: {
      totalMarketCap: number;
      totalVolume: number;
      averageChange24h: number;
      topGainers: CoinMarketData[];
      topLosers: CoinMarketData[];
      marketSummary: string;
    };
  } | null;
  isLoading?: boolean;
}

export function MessageMarketData({ marketData, isLoading = false }: MessageMarketDataProps) {
  if (isLoading) {
    return (
      <div className="space-y-4 mt-4">
        {/* Loading Market Overview */}
        <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 animate-pulse">
          <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-1/4 mb-2"></div>
          <div className="grid grid-cols-3 gap-4 mb-2">
            <div>
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-full mb-1"></div>
              <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-3/4"></div>
            </div>
            <div>
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-full mb-1"></div>
              <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-3/4"></div>
            </div>
            <div>
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-full mb-1"></div>
              <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-3/4"></div>
            </div>
          </div>
          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
        </div>

        {/* Loading Table */}
        <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
          <div className="bg-gray-50 dark:bg-gray-800 p-3">
            <div className="grid grid-cols-6 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-3 bg-gray-300 dark:bg-gray-600 rounded"></div>
              ))}
            </div>
          </div>
          <div className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="p-3">
                <div className="grid grid-cols-6 gap-4 items-center">
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-6"></div>
                  <div className="flex items-center space-x-3">
                    <div className="w-6 h-6 bg-gray-300 dark:bg-gray-600 rounded-full"></div>
                    <div className="flex-1">
                      <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-full mb-1"></div>
                      <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                    </div>
                  </div>
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!marketData?.coins || marketData.coins.length === 0) {
    return (
      <div className="mt-4 p-4 text-center text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-gray-700 rounded-lg">
        No market data available
      </div>
    );
  }

  return (
    <div className="mt-4">
      <MarketTable coins={marketData.coins} analytics={marketData.analytics} />
    </div>
  );
}
