"use client";

import React from "react";
import { MarketTable } from "@/components/market/MarketTable";
import { CoinMarketData } from "@/types/market";
import { Loader } from "@/components/prompt-kit/loader";

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

export function MessageMarketData({
  marketData,
  isLoading = false,
}: MessageMarketDataProps) {
  if (isLoading) {
    return (
      <div className="space-y-4 mt-4">
        {/* Loading Market Overview */}
        <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
          <div className="flex items-center gap-3 mb-4">
            <Loader variant="bars" size="sm" />
            <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Loading market overview...
            </div>
          </div>
          <div className="space-y-3">
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <div className="text-xs text-gray-500">Market Cap</div>
                <div className="flex items-center gap-2">
                  <Loader variant="pulse-dot" size="sm" />
                  <span className="text-xs text-gray-400">Loading...</span>
                </div>
              </div>
              <div className="space-y-2">
                <div className="text-xs text-gray-500">Volume</div>
                <div className="flex items-center gap-2">
                  <Loader variant="pulse-dot" size="sm" />
                  <span className="text-xs text-gray-400">Loading...</span>
                </div>
              </div>
              <div className="space-y-2">
                <div className="text-xs text-gray-500">Change</div>
                <div className="flex items-center gap-2">
                  <Loader variant="pulse-dot" size="sm" />
                  <span className="text-xs text-gray-400">Loading...</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Loading Table */}
        <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
          <div className="bg-gray-50 dark:bg-gray-800 p-3">
            <div className="grid grid-cols-6 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="h-3 bg-gray-300 dark:bg-gray-600 rounded"
                ></div>
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
      <MarketTable
        coins={marketData.coins}
        analytics={marketData.analytics}
        itemsPerPage={10}
      />
    </div>
  );
}
