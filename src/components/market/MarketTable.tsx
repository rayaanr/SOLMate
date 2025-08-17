'use client';

import React from 'react';
import { CoinMarketData } from '@/src/types/market';
import { formatPrice, formatNumber, formatPercentageChange } from '@/src/utils/market-analytics';

interface MarketTableProps {
  coins: CoinMarketData[];
  analytics?: {
    totalMarketCap: number;
    totalVolume: number;
    averageChange24h: number;
    marketSummary: string;
  };
}

export function MarketTable({ coins, analytics }: MarketTableProps) {
  if (!coins || coins.length === 0) {
    return (
      <div className="p-4 text-center text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-gray-700 rounded-lg">
        No market data available
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Market Summary */}
      {analytics && (
        <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Market Overview</h3>
          <div className="grid grid-cols-3 gap-4 mb-2">
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Total Market Cap</p>
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                ${formatNumber(analytics.totalMarketCap)}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">24h Volume</p>
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                ${formatNumber(analytics.totalVolume)}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Avg Change</p>
              <p className={`text-sm font-medium ${
                analytics.averageChange24h >= 0 
                  ? 'text-green-600 dark:text-green-400' 
                  : 'text-red-600 dark:text-red-400'
              }`}>
                {analytics.averageChange24h >= 0 ? '+' : ''}{analytics.averageChange24h.toFixed(2)}%
              </p>
            </div>
          </div>
          <p className="text-xs text-gray-600 dark:text-gray-300 mt-2">
            {analytics.marketSummary}
          </p>
        </div>
      )}

      {/* Market Table */}
      <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  #
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Asset
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Price
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  24h Change
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Market Cap
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Volume (24h)
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
              {coins.map((coin, index) => {
                const changeData = formatPercentageChange(coin.price_change_percentage_24h);
                
                return (
                  <tr key={coin.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                    <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                      {coin.market_cap_rank || index + 1}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center space-x-3">
                        <img
                          src={coin.image}
                          alt={coin.name}
                          className="w-6 h-6 rounded-full"
                          onError={(e) => {
                            e.currentTarget.src = '/placeholder-coin.png';
                          }}
                        />
                        <div>
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {coin.name}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400 uppercase">
                            {coin.symbol}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right text-sm font-medium text-gray-900 dark:text-white">
                      {formatPrice(coin.current_price)}
                    </td>
                    <td className={`px-4 py-3 text-right text-sm font-medium ${
                      changeData.isPositive 
                        ? 'text-green-600 dark:text-green-400' 
                        : 'text-red-600 dark:text-red-400'
                    }`}>
                      {changeData.value}
                    </td>
                    <td className="px-4 py-3 text-right text-sm text-gray-900 dark:text-white">
                      ${formatNumber(coin.market_cap)}
                    </td>
                    <td className="px-4 py-3 text-right text-sm text-gray-900 dark:text-white">
                      ${formatNumber(coin.total_volume)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
