"use client";

import React, { useMemo } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  flexRender,
  createColumnHelper,
  SortingState,
} from "@tanstack/react-table";
import { useMarketData } from '@/hooks/useOptimizedDataFetch';
import { CoinMarketData } from '@/src/types/market';
import { formatPrice, formatNumber, formatPercentageChange } from '@/src/utils/market-analytics';
import Image from "next/image";

const columnHelper = createColumnHelper<CoinMarketData>();

interface MessageMarketTableProps {
  // Either provide data directly
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
  };
  // Or provide a dataId to fetch data
  dataId?: string;
}

// Memoized coin image component with error handling
const CoinImage: React.FC<{ coin: CoinMarketData }> = React.memo(({ coin }) => {
  const [imageError, setImageError] = React.useState(false);

  if (imageError || !coin.image) {
    return (
      <div className="w-6 h-6 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center text-xs text-gray-500">
        {coin.symbol.charAt(0).toUpperCase()}
      </div>
    );
  }

  return (
    <Image
      src={coin.image}
      alt={coin.name}
      width={24}
      height={24}
      className="w-6 h-6 rounded-full"
      onError={() => setImageError(true)}
      loading="lazy"
    />
  );
});

CoinImage.displayName = 'CoinImage';

export const MessageMarketTable: React.FC<MessageMarketTableProps> = ({
  marketData: directMarketData,
  dataId,
}) => {
  // ALL HOOKS MUST BE CALLED AT THE TOP LEVEL - NO EXCEPTIONS
  const [sorting, setSorting] = React.useState<SortingState>([]);
  
  // Use TanStack Query if dataId is provided, otherwise use direct data
  const { data: fetchedData, isLoading, error } = useMarketData(dataId || null);
  
  // Use fetched data if available, otherwise use direct props
  const coins = directMarketData?.coins || fetchedData?.coins || [];
  const analytics = directMarketData?.analytics || fetchedData?.analytics;

  const columns = useMemo(
    () => [
      columnHelper.display({
        id: 'rank',
        header: '#',
        cell: (info) => {
          // Try to use market_cap_rank if available, otherwise use row index
          const rank = info.row.original.market_cap_rank || info.row.index + 1;
          return (
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {rank}
            </span>
          );
        },
        enableSorting: false, // Disable sorting for display column
        size: 50,
      }),
      columnHelper.accessor('name', {
        id: 'asset',
        header: 'Asset',
        cell: (info) => (
          <div className="flex items-center space-x-3">
            <CoinImage coin={info.row.original} />
            <div>
              <div className="text-sm font-medium text-gray-900 dark:text-white">
                {info.getValue()}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400 uppercase">
                {info.row.original.symbol}
              </div>
            </div>
          </div>
        ),
        enableSorting: true,
      }),
      columnHelper.accessor('current_price', {
        id: 'price',
        header: 'Price',
        cell: (info) => (
          <div className="text-right text-sm font-medium text-gray-900 dark:text-white">
            {formatPrice(info.getValue())}
          </div>
        ),
        enableSorting: true,
      }),
      columnHelper.accessor('price_change_percentage_24h', {
        id: 'change',
        header: '24h Change',
        cell: (info) => {
          const changeData = formatPercentageChange(info.getValue());
          return (
            <div className={`text-right text-sm font-medium ${
              changeData.isPositive 
                ? 'text-green-600 dark:text-green-400' 
                : 'text-red-600 dark:text-red-400'
            }`}>
              {changeData.value}
            </div>
          );
        },
        enableSorting: true,
      }),
      columnHelper.accessor('market_cap', {
        id: 'marketCap',
        header: 'Market Cap',
        cell: (info) => (
          <div className="text-right text-sm text-gray-900 dark:text-white">
            ${formatNumber(info.getValue())}
          </div>
        ),
        enableSorting: true,
      }),
      columnHelper.accessor('total_volume', {
        id: 'volume',
        header: 'Volume (24h)',
        cell: (info) => (
          <div className="text-right text-sm text-gray-900 dark:text-white">
            ${formatNumber(info.getValue())}
          </div>
        ),
        enableSorting: true,
      }),
    ],
    []
  );

  const table = useReactTable({
    data: coins,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onSortingChange: setSorting,
    state: {
      sorting,
    },
    initialState: {
      pagination: {
        pageSize: 10,
      },
    },
  });

  // Handle loading state for fetched data
  if (dataId && isLoading) {
    return (
      <div className="mt-4">
        <div className="animate-pulse flex items-center gap-3 p-3 bg-orange-50 rounded-lg border border-orange-200">
          <div className="w-5 h-5 bg-orange-400 rounded-full"></div>
          <div className="flex-1">
            <div className="h-4 bg-orange-200 rounded w-40 mb-1"></div>
            <div className="h-3 bg-orange-100 rounded w-60"></div>
          </div>
        </div>
      </div>
    );
  }
  
  // Handle error state for fetched data
  if (dataId && error) {
    return (
      <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
        <p className="text-red-600 text-sm">Failed to load market data: {error.message}</p>
      </div>
    );
  }
  
  // Handle no data after calculations
  if (!coins || coins.length === 0) {
    return (
      <div className="mt-4 p-4 text-center text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-gray-700 rounded-lg">
        No market data available
      </div>
    );
  }

  return (
    <div className="bg-gray-50 rounded-lg p-4 mt-3 border">
      {/* Header with market overview */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Market Overview</h3>
        <div className="text-right">
          <div className="text-xl font-bold text-blue-600">
            {coins.length} Coins
          </div>
          <div className="text-xs text-gray-500">Market Data</div>
        </div>
      </div>

      {/* Market Analytics Summary Cards */}
      {analytics && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
          <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
            <div className="text-blue-700 font-semibold text-sm">Total Market Cap</div>
            <div className="text-blue-900 font-bold">
              ${formatNumber(analytics.totalMarketCap)}
            </div>
          </div>
          <div className="bg-green-50 p-3 rounded-lg border border-green-200">
            <div className="text-green-700 font-semibold text-sm">24h Volume</div>
            <div className="text-green-900 font-bold">
              ${formatNumber(analytics.totalVolume)}
            </div>
          </div>
          <div className="bg-purple-50 p-3 rounded-lg border border-purple-200">
            <div className="text-purple-700 font-semibold text-sm">Avg Change</div>
            <div className={`font-bold ${
              analytics.averageChange24h >= 0 
                ? 'text-green-600' 
                : 'text-red-600'
            }`}>
              {analytics.averageChange24h >= 0 ? '+' : ''}{analytics.averageChange24h.toFixed(2)}%
            </div>
          </div>
        </div>
      )}

      {/* Market Summary */}
      {analytics?.marketSummary && (
        <div className="bg-white rounded-lg border p-3 mb-4">
          <p className="text-sm text-gray-600 dark:text-gray-300">
            {analytics.marketSummary}
          </p>
        </div>
      )}

      {/* Market Table */}
      <div className="bg-white rounded-lg border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <th
                      key={header.id}
                      className={`p-3 text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 ${
                        header.id === 'rank' || header.id === 'asset' ? 'text-left' : 'text-right'
                      }`}
                      onClick={
                        header.column.getCanSort()
                          ? header.column.getToggleSortingHandler()
                          : undefined
                      }
                      style={{
                        width:
                          header.getSize() !== 150
                            ? header.getSize()
                            : undefined,
                      }}
                    >
                      <div className="flex items-center space-x-1">
                        {flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                        {header.column.getCanSort() && (
                          <span>
                            {{
                              asc: " ↗",
                              desc: " ↙",
                            }[header.column.getIsSorted() as string] ?? null}
                          </span>
                        )}
                      </div>
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody className="divide-y divide-gray-100">
              {table.getRowModel().rows.map((row) => (
                <tr key={row.id} className="hover:bg-gray-50">
                  {row.getVisibleCells().map((cell) => (
                    <td 
                      key={cell.id} 
                      className={`p-3 ${
                        cell.column.id === 'rank' || cell.column.id === 'asset' ? 'text-left' : 'text-right'
                      }`}
                    >
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {table.getPageCount() > 1 && (
        <div className="flex justify-center items-center space-x-2 mt-3">
          <button
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
            className="px-3 py-1 text-xs border rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 border-gray-300 text-gray-700"
          >
            ← Previous
          </button>
          
          <span className="text-xs text-gray-600">
            Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
          </span>
          
          <button
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
            className="px-3 py-1 text-xs border rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 border-gray-300 text-gray-700"
          >
            Next →
          </button>
        </div>
      )}

      {/* Footer */}
      <div className="mt-3 text-center text-xs text-gray-500">
        Showing {table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1}-
        {Math.min((table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize, coins.length)} of {coins.length} coin{coins.length !== 1 ? 's' : ''} • 
        Data updated at {new Date().toLocaleTimeString()}
      </div>
    </div>
  );
};
