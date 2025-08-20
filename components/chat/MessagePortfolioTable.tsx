"use client";

import React, { useMemo } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  getFilteredRowModel,
  flexRender,
  createColumnHelper,
  SortingState,
  ColumnFiltersState,
} from "@tanstack/react-table";
import { GlobalFilter, AdvancedFilterPanel, TableActions } from '@/components/ui/TableFilters';
import { usePortfolioData } from '@/hooks/useOptimizedDataFetch';
import { TokenData } from "@/services/wallet/wallet-data";
import Image from "next/image";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";

const columnHelper = createColumnHelper<TokenData>();

interface MessagePortfolioTableProps {
  // Either provide data directly
  tokens?: TokenData[];
  nativeBalance?: {
    solana: string;
    usd_value: string;
  };
  // Or provide a dataId to fetch data
  dataId?: string;
}

// Token logo component with fallback
const TokenLogo: React.FC<{ logo?: string | null; symbol: string }> = ({ 
  logo, 
  symbol 
}) => {
  if (logo) {
    return (
      <Image
        src={logo}
        width={24}
        height={24}
        alt={`${symbol} logo`}
        className="w-5 h-5 rounded-full"
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
    <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-semibold">
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
    maximumFractionDigits: 4, // Reduced for compact display
  }).format(num);
};

// Format percentage change
const formatPercentChange = (change?: number) => {
  if (change === undefined || change === null) return '—';
  
  const arrow = change >= 0 ? '▲' : '▼';
  const colorClass = change >= 0 ? 'text-green-500' : 'text-red-500';
  
  return (
    <span className={`text-xs ${colorClass}`}>
      <span>{arrow}</span>
      <span className="ml-1">{Math.abs(change).toFixed(2)}%</span>
    </span>
  );
};

export const MessagePortfolioTable: React.FC<MessagePortfolioTableProps> = ({
  tokens: directTokens,
  nativeBalance: directNativeBalance,
  dataId,
}) => {
  // ALL HOOKS MUST BE CALLED AT THE TOP LEVEL - NO EXCEPTIONS
  const [sorting, setSorting] = React.useState<SortingState>([
    { id: 'usd_value', desc: true } // Sort by value descending by default
  ]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [globalFilter, setGlobalFilter] = React.useState('');
  const [showFilters, setShowFilters] = React.useState(false);
  
  // Use TanStack Query if dataId is provided, otherwise use direct data
  const { data: fetchedData, isLoading, error } = usePortfolioData(dataId || null);
  
  // Use fetched data if available, otherwise use direct props
  const tokens = directTokens || fetchedData?.tokens || [];
  const nativeBalance = directNativeBalance || fetchedData?.native_balance || { solana: '0', usd_value: '0' };
  
  // Filter out tokens with zero value for cleaner display
  const filteredTokens = tokens.filter((token: TokenData) => parseFloat(token.usd_value) > 0.01);

  const columns = useMemo(
    () => [
      columnHelper.accessor('symbol', {
        header: 'Token',
        cell: (info) => {
          const token = info.row.original;
          return (
            <div className="flex items-center gap-2">
              <TokenLogo logo={token.logo} symbol={token.symbol} />
              <div>
                <div className="font-medium text-sm">{token.symbol}</div>
                <div className="text-xs text-gray-500 truncate max-w-20">
                  {token.name}
                </div>
              </div>
            </div>
          );
        },
        enableSorting: true,
        enableColumnFilter: true,
        filterFn: 'includesString',
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
        enableColumnFilter: true,
      }),
      columnHelper.accessor('usd_value', {
        header: 'Value',
        cell: (info) => (
          <div className="text-right font-medium text-sm">
            {formatUSD(info.getValue())}
          </div>
        ),
        enableSorting: true,
        enableColumnFilter: true,
        sortingFn: (rowA, rowB) => {
          const a = parseFloat(rowA.original.usd_value) || 0;
          const b = parseFloat(rowB.original.usd_value) || 0;
          return a - b;
        },
      }),
      columnHelper.accessor('price_24h_pct', {
        header: '24h',
        cell: (info) => (
          <div className="text-right">
            {formatPercentChange(info.getValue())}
          </div>
        ),
        enableSorting: true,
      }),
    ],
    []
  );

  const table = useReactTable({
    data: filteredTokens,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    globalFilterFn: 'includesString',
    state: {
      sorting,
      columnFilters,
      globalFilter,
    },
    initialState: {
      pagination: {
        pageSize: 10,
      },
    },
  });

  // Calculate total portfolio value
  const totalTokenValue = filteredTokens.reduce((sum: number, token: TokenData) => {
    return sum + (parseFloat(token.usd_value) || 0);
  }, 0);
  
  const solValue = parseFloat(nativeBalance.usd_value) || 0;
  const totalPortfolioValue = totalTokenValue + solValue;

  // Handle loading state for fetched data
  if (dataId && isLoading) {
    return (
      <div className="mt-4">
        <div className="animate-pulse flex items-center gap-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
          <div className="w-5 h-5 bg-blue-400 rounded-full"></div>
          <div className="flex-1">
            <div className="h-4 bg-blue-200 rounded w-32 mb-1"></div>
            <div className="h-3 bg-blue-100 rounded w-48"></div>
          </div>
        </div>
      </div>
    );
  }
  
  // Handle error state for fetched data
  if (dataId && error) {
    return (
      <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
        <p className="text-red-600 text-sm">Failed to load portfolio data: {error.message}</p>
      </div>
    );
  }
  
  // Handle no data after calculations
  if (!tokens || tokens.length === 0) {
    return (
      <div className="mt-4 p-4 text-center text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-gray-700 rounded-lg">
        No portfolio data available
      </div>
    );
  }

  return (
    <div className="bg-gray-50 rounded-lg p-4 mt-3 border">
      {/* Header with total value */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Portfolio Overview</h3>
        <div className="text-right">
          <div className="text-xl font-bold text-green-600">
            {formatUSD(totalPortfolioValue)}
          </div>
          <div className="text-xs text-gray-500">Total Value</div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="space-y-3 mb-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex-1 max-w-md">
            <GlobalFilter
              globalFilter={globalFilter}
              setGlobalFilter={setGlobalFilter}
              placeholder="Search tokens..."
            />
          </div>
          <div className="flex items-center gap-2">
            <AdvancedFilterPanel
              table={table}
              isOpen={showFilters}
              onToggle={() => setShowFilters(!showFilters)}
            />
            <TableActions
              onExport={(format) => {
                // Export functionality can be implemented here
                console.log(`Exporting portfolio data as ${format}`);
              }}
            />
          </div>
        </div>
        {showFilters && (
          <AdvancedFilterPanel
            table={table}
            isOpen={showFilters}
            onToggle={() => setShowFilters(!showFilters)}
          />
        )}
      </div>

      {/* SOL Balance */}
      {solValue > 0 && (
        <div className="flex items-center justify-between p-3 bg-white rounded-lg mb-3 border">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-full bg-purple-500 flex items-center justify-center text-white text-xs font-semibold">
              SOL
            </div>
            <div>
              <div className="font-medium text-sm">Solana</div>
              <div className="text-xs text-gray-500">Native Balance</div>
            </div>
          </div>
          <div className="text-right">
            <div className="font-medium text-sm">{formatUSD(solValue)}</div>
            <div className="text-xs text-gray-500">
              {parseFloat(nativeBalance.solana).toFixed(4)} SOL
            </div>
          </div>
        </div>
      )}

      {/* Tokens Table */}
      {filteredTokens.length > 0 ? (
        <div className="bg-white rounded-lg border">
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <TableHead
                      key={header.id}
                      className="cursor-pointer hover:bg-muted/50"
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
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <div className="bg-white rounded-lg border p-6 text-center">
          <p className="text-gray-500">No tokens with significant value found</p>
        </div>
      )}

      {/* Pagination */}
      {table.getPageCount() > 1 && (
        <div className="flex justify-center items-center space-x-2 mt-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            ← Previous
          </Button>
          
          <span className="text-xs text-gray-600">
            Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
          </span>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            Next →
          </Button>
        </div>
      )}

      {/* Footer */}
      <div className="mt-3 text-center text-xs text-gray-500">
        Showing {table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1}-
        {Math.min((table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize, filteredTokens.length)} of {filteredTokens.length} token{filteredTokens.length !== 1 ? 's' : ''} • 
        Data updated at {new Date().toLocaleTimeString()}
      </div>
    </div>
  );
};
