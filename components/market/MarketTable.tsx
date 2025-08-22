"use client";

import React, { useState, useMemo } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  flexRender,
  createColumnHelper,
  SortingState,
} from "@tanstack/react-table";
import { CoinMarketData } from "@/types/market";
import {
  formatPrice,
  formatNumber,
  formatPercentageChange,
} from "@/services/utils/market-analytics";
import Image from "next/image";

interface MarketTableProps {
  coins: CoinMarketData[];
  analytics?: {
    totalMarketCap: number;
    totalVolume: number;
    averageChange24h: number;
    marketSummary: string;
  };
  itemsPerPage?: number;
}

// Memoized image component with error handling
const CoinImage = React.memo(({ coin }: { coin: CoinMarketData }) => {
  const [imageError, setImageError] = useState(false);

  if (imageError) {
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

CoinImage.displayName = "CoinImage";

const columnHelper = createColumnHelper<CoinMarketData>();

export function MarketTable({
  coins,
  analytics,
  itemsPerPage = 10,
}: MarketTableProps) {
  const [sorting, setSorting] = useState<SortingState>([]);

  const columns = useMemo(
    () => [
      columnHelper.accessor("market_cap_rank", {
        id: "rank",
        header: "#",
        cell: (info) => (
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {info.getValue() || info.row.index + 1}
          </span>
        ),
        enableSorting: true,
      }),
      columnHelper.accessor("name", {
        id: "asset",
        header: "Asset",
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
      columnHelper.accessor("current_price", {
        id: "price",
        header: "Price",
        cell: (info) => (
          <span className="text-sm font-medium text-gray-900 dark:text-white">
            {formatPrice(info.getValue())}
          </span>
        ),
        enableSorting: true,
      }),
      columnHelper.accessor("price_change_percentage_24h", {
        id: "change",
        header: "24h Change",
        cell: (info) => {
          const changeData = formatPercentageChange(info.getValue());
          return (
            <span
              className={`text-sm font-medium ${
                changeData.isPositive
                  ? "text-green-600 dark:text-green-400"
                  : "text-red-600 dark:text-red-400"
              }`}
            >
              {changeData.value}
            </span>
          );
        },
        enableSorting: true,
      }),
      columnHelper.accessor("market_cap", {
        id: "marketCap",
        header: "Market Cap",
        cell: (info) => (
          <span className="text-sm text-gray-900 dark:text-white">
            ${formatNumber(info.getValue())}
          </span>
        ),
        enableSorting: true,
      }),
      columnHelper.accessor("total_volume", {
        id: "volume",
        header: "Volume (24h)",
        cell: (info) => (
          <span className="text-sm text-gray-900 dark:text-white">
            ${formatNumber(info.getValue())}
          </span>
        ),
        enableSorting: true,
      }),
    ],
    []
  );

  const table = useReactTable({
    data: coins,
    columns,
    state: {
      sorting,
    },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: {
      pagination: {
        pageSize: itemsPerPage,
      },
    },
  });

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
          <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
            Market Overview
          </h3>
          <div className="grid grid-cols-3 gap-4 mb-2">
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Total Market Cap
              </p>
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                ${formatNumber(analytics.totalMarketCap)}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                24h Volume
              </p>
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                ${formatNumber(analytics.totalVolume)}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Avg Change
              </p>
              <p
                className={`text-sm font-medium ${
                  analytics.averageChange24h >= 0
                    ? "text-green-600 dark:text-green-400"
                    : "text-red-600 dark:text-red-400"
                }`}
              >
                {analytics.averageChange24h >= 0 ? "+" : ""}
                {analytics.averageChange24h.toFixed(2)}%
              </p>
            </div>
          </div>
          <p className="text-xs text-gray-600 dark:text-gray-300 mt-2">
            {analytics.marketSummary}
          </p>
        </div>
      )}

      {/* Results Info */}
      <div className="flex justify-between items-center">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Showing{" "}
          {table.getState().pagination.pageIndex *
            table.getState().pagination.pageSize +
            1}
          -
          {Math.min(
            (table.getState().pagination.pageIndex + 1) *
              table.getState().pagination.pageSize,
            coins.length
          )}{" "}
          of {coins.length} coins
        </p>
      </div>

      {/* Market Table */}
      <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-800">
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <th
                      key={header.id}
                      className={`px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider ${
                        header.id === "rank" || header.id === "asset"
                          ? "text-left"
                          : "text-right"
                      } ${
                        header.column.getCanSort()
                          ? "cursor-pointer select-none hover:bg-gray-100 dark:hover:bg-gray-700"
                          : ""
                      }`}
                      onClick={header.column.getToggleSortingHandler()}
                    >
                      <div className="flex items-center gap-2">
                        {flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                        {header.column.getCanSort() && (
                          <span className="text-gray-400">
                            {{
                              asc: "↑",
                              desc: "↓",
                            }[header.column.getIsSorted() as string] ?? "↕"}
                          </span>
                        )}
                      </div>
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
              {table.getRowModel().rows.map((row) => (
                <tr
                  key={row.id}
                  className="hover:bg-gray-50 dark:hover:bg-gray-800"
                >
                  {row.getVisibleCells().map((cell) => (
                    <td
                      key={cell.id}
                      className={`px-4 py-3 ${
                        cell.column.id === "rank" || cell.column.id === "asset"
                          ? "text-left"
                          : "text-right"
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
        <div className="flex justify-center items-center space-x-2">
          <button
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
            className="px-3 py-2 text-sm border rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300"
          >
            ← Previous
          </button>

          <span className="text-sm text-gray-600 dark:text-gray-400">
            {table.getState().pagination.pageIndex + 1} of{" "}
            {table.getPageCount()}
          </span>

          <button
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
            className="px-3 py-2 text-sm border rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300"
          >
            Next →
          </button>
        </div>
      )}
    </div>
  );
}
