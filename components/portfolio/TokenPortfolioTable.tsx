"use client";

import React, { useMemo } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  flexRender,
  createColumnHelper,
  SortingState,
  ColumnFiltersState,
} from "@tanstack/react-table";
import { TokenData } from "@/services/wallet/wallet-data";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";

const columnHelper = createColumnHelper<TokenData>();

interface TokenPortfolioTableProps {
  data?: TokenData[];
  loading: boolean;
  error: Error | null;
  onRefresh: () => void;
  globalFilter: string;
  onGlobalFilterChange: (value: string) => void;
}

// Token logo component with fallback
const TokenLogo: React.FC<{ logo?: string | null; symbol: string }> = ({ 
  logo, 
  symbol 
}) => {
  if (logo) {
    return (
      <img
        src={logo}
        alt={`${symbol} logo`}
        className="w-6 h-6 rounded-full"
        onError={(e) => {
          // Fallback to text if image fails to load
          e.currentTarget.style.display = 'none';
          if (e.currentTarget.nextSibling) {
            (e.currentTarget.nextSibling as HTMLElement).style.display = 'flex';
          }
        }}
      />
    );
  }
  
  return (
    <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-semibold">
      {symbol.charAt(0).toUpperCase()}
    </div>
  );
};

// Format USD values
const formatUSD = (value: string | number) => {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(num) || num === 0) return '$0.00';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num);
};

// Format token amounts
const formatTokenAmount = (amount?: string) => {
  if (!amount) return '0';
  const num = parseFloat(amount);
  if (isNaN(num)) return '0';
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 6,
  }).format(num);
};

// Format percentage change
const formatPercentChange = (change?: number | null) => {
  if (change === null || change === undefined) return '—';
  
  const arrow = change >= 0 ? '▲' : '▼';
  const colorClass = change >= 0 ? 'text-green-500' : 'text-red-500';
  
  return (
    <span className={`flex items-center gap-1 ${colorClass}`}>
      <span>{arrow}</span>
      <span>{Math.abs(change).toFixed(2)}%</span>
    </span>
  );
};

export const TokenPortfolioTable: React.FC<TokenPortfolioTableProps> = ({
  data = [],
  loading,
  error,
  onRefresh,
  globalFilter,
  onGlobalFilterChange,
}) => {
  const [sorting, setSorting] = React.useState<SortingState>([
    { id: 'usd_value', desc: true } // Sort by value descending by default
  ]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);

  const columns = useMemo(
    () => [
      columnHelper.accessor('symbol', {
        header: 'Token',
        cell: (info) => {
          const token = info.row.original;
          return (
            <div className="flex items-center gap-3">
              <TokenLogo logo={token.logo} symbol={token.symbol} />
              <div>
                <div className="font-medium text-sm">{token.symbol}</div>
                <div className="text-xs text-gray-500 truncate max-w-24">
                  {token.name}
                </div>
              </div>
            </div>
          );
        },
        enableSorting: true,
        filterFn: (row, columnId, value) => {
          const token = row.original;
          const searchValue = value.toLowerCase();
          return (
            token.symbol.toLowerCase().includes(searchValue) ||
            token.name.toLowerCase().includes(searchValue)
          );
        },
      }),
      columnHelper.accessor('amount', {
        header: 'Amount',
        cell: (info) => (
          <div className="text-right font-mono text-sm">
            {formatTokenAmount(info.getValue())}
          </div>
        ),
        enableSorting: true,
      }),
      columnHelper.accessor('price_usd', {
        header: 'Price',
        cell: (info) => {
          const value = info.getValue();
          return (
            <div className="text-right text-sm">
              {value && value > 0 ? formatUSD(value) : '—'}
            </div>
          );
        },
        enableSorting: true,
      }),
      columnHelper.accessor('usd_value', {
        header: 'Value',
        cell: (info) => (
          <div className="text-right font-medium text-sm">
            {formatUSD(info.getValue())}
          </div>
        ),
        enableSorting: true,
        sortingFn: (rowA, rowB) => {
          const a = parseFloat(rowA.original.usd_value) || 0;
          const b = parseFloat(rowB.original.usd_value) || 0;
          return a - b;
        },
      }),
      columnHelper.accessor('price_24h_pct', {
        header: '24h %',
        cell: (info) => (
          <div className="text-right text-sm">
            {formatPercentChange(info.getValue())}
          </div>
        ),
        enableSorting: true,
      }),
    ],
    []
  );

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    state: {
      sorting,
      columnFilters,
      globalFilter,
    },
    onGlobalFilterChange,
    globalFilterFn: 'includesString',
  });

  // Loading skeleton
  const LoadingSkeleton = () => (
    <div className="space-y-2">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-center space-x-3 p-3">
          <div className="w-6 h-6 bg-gray-200 rounded-full animate-pulse"></div>
          <div className="flex-1 space-y-1">
            <div className="h-4 bg-gray-200 rounded animate-pulse w-20"></div>
            <div className="h-3 bg-gray-100 rounded animate-pulse w-16"></div>
          </div>
          <div className="w-20 h-4 bg-gray-200 rounded animate-pulse"></div>
          <div className="w-16 h-4 bg-gray-200 rounded animate-pulse"></div>
          <div className="w-20 h-4 bg-gray-200 rounded animate-pulse"></div>
          <div className="w-16 h-4 bg-gray-200 rounded animate-pulse"></div>
        </div>
      ))}
    </div>
  );

  // Error state
  if (error) {
    return (
      <div className="p-6 text-center">
        <p className="text-red-500 mb-4">Failed to load portfolio data</p>
        <Button onClick={onRefresh} variant="outline" size="sm">
          <RefreshCw className="w-4 h-4 mr-2" />
          Retry
        </Button>
      </div>
    );
  }

  // Empty state
  if (!loading && data.length === 0) {
    return (
      <div className="p-6 text-center">
        <p className="text-gray-500 mb-4">No tokens found</p>
        <Button onClick={onRefresh} variant="outline" size="sm">
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>
    );
  }

  return (
    <div className="w-full">
      {loading ? (
        <LoadingSkeleton />
      ) : (
        <div className="overflow-x-auto">
          {/* Desktop table */}
          <div className="hidden md:block">
            <table className="w-full">
              <thead>
                {table.getHeaderGroups().map((headerGroup) => (
                  <tr key={headerGroup.id} className="border-b border-gray-200">
                    {headerGroup.headers.map((header) => (
                      <th
                        key={header.id}
                        className="text-left p-3 text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-50"
                        onClick={header.column.getToggleSortingHandler()}
                      >
                        <div className="flex items-center space-x-1">
                          {flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                          {{
                            asc: ' ↗',
                            desc: ' ↙',
                          }[header.column.getIsSorted() as string] ?? null}
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
                      <td key={cell.id} className="p-3">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile card layout */}
          <div className="md:hidden space-y-3">
            {table.getRowModel().rows.map((row) => {
              const token = row.original;
              return (
                <div key={row.id} className="bg-white border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <TokenLogo logo={token.logo} symbol={token.symbol} />
                      <div>
                        <div className="font-medium text-sm">{token.symbol}</div>
                        <div className="text-xs text-gray-500">{token.name}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium text-sm">
                        {formatUSD(token.usd_value)}
                      </div>
                      <div className="text-xs">
                        {formatPercentChange(token.price_24h_pct)}
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>{formatTokenAmount(token.amount)}</span>
                    <span>
                      {token.price_usd && token.price_usd > 0 
                        ? formatUSD(token.price_usd) 
                        : '—'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
