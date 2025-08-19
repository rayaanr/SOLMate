"use client";

import React, { useMemo } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  flexRender,
  createColumnHelper,
  SortingState,
} from "@tanstack/react-table";
import { TokenData } from "@/services/wallet/wallet-data";
import Image from "next/image";

const columnHelper = createColumnHelper<TokenData>();

interface MessagePortfolioTableProps {
  tokens: TokenData[];
  nativeBalance: {
    solana: string;
    usd_value: string;
  };
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
  tokens,
  nativeBalance,
}) => {
  const [sorting, setSorting] = React.useState<SortingState>([
    { id: 'usd_value', desc: true } // Sort by value descending by default
  ]);

  // Filter out tokens with zero value for cleaner display
  const filteredTokens = tokens.filter(token => parseFloat(token.usd_value) > 0.01);

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
    onSortingChange: setSorting,
    state: {
      sorting,
    },
  });

  // Calculate total portfolio value
  const totalTokenValue = filteredTokens.reduce((sum, token) => {
    return sum + (parseFloat(token.usd_value) || 0);
  }, 0);
  
  const solValue = parseFloat(nativeBalance.usd_value) || 0;
  const totalPortfolioValue = totalTokenValue + solValue;

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
        <div className="bg-white rounded-lg border overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <th
                      key={header.id}
                      className="text-left p-3 text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
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
      ) : (
        <div className="bg-white rounded-lg border p-6 text-center">
          <p className="text-gray-500">No tokens with significant value found</p>
        </div>
      )}

      {/* Footer */}
      <div className="mt-3 text-center text-xs text-gray-500">
        {filteredTokens.length} token{filteredTokens.length !== 1 ? 's' : ''} shown • 
        Data updated at {new Date().toLocaleTimeString()}
      </div>
    </div>
  );
};
