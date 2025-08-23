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
import { useTransactionData } from "@/hooks/useOptimizedDataFetch";
import { ProcessedTransaction } from "@/services/wallet/transaction-data";
import {
  formatDateShort,
  formatSignature,
  formatTokenAmount,
} from "@/services/utils/formatters";
import { Loader } from "@/components/prompt-kit/loader";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";

const columnHelper = createColumnHelper<ProcessedTransaction>();

interface MessageTransactionTableProps {
  // Either provide data directly
  transactions?: ProcessedTransaction[];
  analytics?: {
    totalTransactions: number;
    totalFeesSpent: number;
    incomingTransactions: number;
    outgoingTransactions: number;
    swapTransactions: number;
  };
  // Or provide a dataId to fetch data
  dataId?: string;
}

// Transaction direction indicator
const DirectionIndicator: React.FC<{
  direction: ProcessedTransaction["direction"];
}> = ({ direction }) => {
  const config = {
    incoming: { icon: "↓", color: "text-green-500", bg: "bg-green-100" },
    outgoing: { icon: "↑", color: "text-red-500", bg: "bg-red-100" },
    swap: { icon: "⇄", color: "text-blue-500", bg: "bg-blue-100" },
    other: { icon: "◦", color: "text-gray-500", bg: "bg-gray-100" },
  }[direction];

  return (
    <div
      className={`w-6 h-6 rounded-full ${config.bg} flex items-center justify-center`}
    >
      <span className={`text-xs font-bold ${config.color}`}>{config.icon}</span>
    </div>
  );
};

// Transaction type badge
const TypeBadge: React.FC<{ type: string }> = ({ type }) => {
  const typeConfig: Record<string, { label: string; color: string }> = {
    TRANSFER: { label: "Transfer", color: "bg-blue-100 text-blue-800" },
    SWAP: { label: "Swap", color: "bg-purple-100 text-purple-800" },
    COMPRESSED_NFT_MINT: {
      label: "NFT Mint",
      color: "bg-green-100 text-green-800",
    },
    UNKNOWN: { label: "Other", color: "bg-gray-100 text-gray-800" },
  };

  const config = typeConfig[type] || {
    label: type,
    color: "bg-gray-100 text-gray-800",
  };

  return (
    <span
      className={`px-2 py-1 rounded-full text-xs font-medium ${config.color}`}
    >
      {config.label}
    </span>
  );
};

// Format transaction amount with appropriate colors
const formatAmount = (tx: ProcessedTransaction) => {
  const amount = tx.amount;
  const symbol = tx.symbol;

  if (amount === 0) {
    return <span className="text-gray-500 text-sm">—</span>;
  }

  const colorClass = {
    incoming: "text-green-600",
    outgoing: "text-red-600",
    swap: "text-blue-600",
    other: "text-gray-600",
  }[tx.direction];

  const formattedAmount = formatTokenAmount(amount);

  return (
    <div className={`text-right font-mono text-sm ${colorClass}`}>
      {tx.direction === "outgoing" ? "-" : ""}
      {formattedAmount} {symbol}
    </div>
  );
};

export const MessageTransactionTable: React.FC<
  MessageTransactionTableProps
> = ({
  transactions: directTransactions,
  analytics: directAnalytics,
  dataId,
}) => {
  // ALL HOOKS MUST BE CALLED AT THE TOP LEVEL - NO EXCEPTIONS
  const [sorting, setSorting] = React.useState<SortingState>([
    { id: "date", desc: true }, // Sort by date descending by default
  ]);

  // Use TanStack Query if dataId is provided, otherwise use direct data
  const {
    data: fetchedData,
    isLoading,
    error,
  } = useTransactionData(dataId || null);

  // Use fetched data if available, otherwise use direct props
  const transactions = directTransactions || fetchedData?.transactions || [];
  const analytics = directAnalytics || fetchedData?.analytics;

  // Filter out transactions with zero amounts unless they're special types
  const filteredTransactions = transactions.filter(
    (tx: ProcessedTransaction) =>
      tx.amount > 0 ||
      tx.direction === "other" ||
      tx.type === "COMPRESSED_NFT_MINT"
  );

  const columns = useMemo(
    () => [
      columnHelper.accessor("direction", {
        header: "",
        cell: (info) => <DirectionIndicator direction={info.getValue()} />,
        enableSorting: false,
        size: 50,
      }),
      columnHelper.accessor("date", {
        header: "Date",
        cell: (info) => (
          <div className="text-sm text-gray-900">
            {formatDateShort(info.getValue())}
          </div>
        ),
        enableSorting: true,
        sortingFn: (rowA, rowB) => {
          const dateA = new Date(rowA.original.date).getTime();
          const dateB = new Date(rowB.original.date).getTime();
          return dateA - dateB;
        },
      }),
      columnHelper.accessor("type", {
        header: "Type",
        cell: (info) => <TypeBadge type={info.getValue()} />,
        enableSorting: true,
      }),
      columnHelper.accessor("description", {
        header: "Description",
        cell: (info) => {
          const tx = info.row.original;
          return (
            <div>
              <div className="text-sm font-medium text-gray-900 truncate max-w-40">
                {info.getValue()}
              </div>
              {tx.counterparty && (
                <div className="text-xs text-gray-500 truncate max-w-40">
                  {tx.direction === "incoming" ? "From: " : "To: "}
                  {formatSignature(tx.counterparty)}
                </div>
              )}
            </div>
          );
        },
        enableSorting: false,
      }),
      columnHelper.accessor("amount", {
        header: "Amount",
        cell: (info) => formatAmount(info.row.original),
        enableSorting: true,
        sortingFn: (rowA, rowB) => {
          return rowA.original.amount - rowB.original.amount;
        },
      }),
      columnHelper.accessor("fee", {
        header: "Fee",
        cell: (info) => (
          <div className="text-right text-xs text-gray-500 font-mono">
            {info.getValue().toFixed(6)} SOL
          </div>
        ),
        enableSorting: true,
      }),
      columnHelper.accessor("signature", {
        header: "Tx Hash",
        cell: (info) => (
          <a
            href={`https://explorer.solana.com/tx/${info.getValue()}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-500 hover:text-blue-700 text-xs font-mono underline"
          >
            {formatSignature(info.getValue())}
          </a>
        ),
        enableSorting: false,
      }),
    ],
    []
  );

  const table = useReactTable({
    data: filteredTransactions,
    columns,
    getRowId: (row) => row.signature || `row-${row.date}-${row.amount}`,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onSortingChange: setSorting,
    // Performance optimizations to prevent main thread blocking
    autoResetPageIndex: false,
    autoResetFilters: false,
    autoResetSorting: false,
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
        <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg border border-green-200">
          <Loader variant="wave" size="sm" />
          <div className="flex-1">
            <div className="text-sm font-medium text-green-700">
              Loading transaction history...
            </div>
            <div className="text-xs text-green-600 mt-1">
              Retrieving your recent transactions
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Handle error state for fetched data
  if (dataId && error) {
    return (
      <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
        <p className="text-red-600 text-sm">
          Failed to load transaction data: {error.message}
        </p>
      </div>
    );
  }

  // Handle no data after calculations
  if (!transactions || transactions.length === 0) {
    return (
      <div className="mt-4 p-4 text-center text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-gray-700 rounded-lg">
        No transaction data available
      </div>
    );
  }

  return (
    <div className="bg-gray-50 rounded-lg p-4 mt-3 border">
      {/* Header with analytics summary */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Transaction History</h3>
        {analytics && (
          <div className="text-right">
            <div className="text-xl font-bold text-blue-600">
              {analytics.totalTransactions}
            </div>
            <div className="text-xs text-gray-500">Total Transactions</div>
          </div>
        )}
      </div>

      {/* Analytics Summary Cards */}
      {analytics && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
          <div className="bg-green-50 p-3 rounded-lg border border-green-200">
            <div className="text-green-700 font-semibold text-sm">Incoming</div>
            <div className="text-green-900 font-bold">
              {analytics.incomingTransactions}
            </div>
          </div>
          <div className="bg-red-50 p-3 rounded-lg border border-red-200">
            <div className="text-red-700 font-semibold text-sm">Outgoing</div>
            <div className="text-red-900 font-bold">
              {analytics.outgoingTransactions}
            </div>
          </div>
          <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
            <div className="text-blue-700 font-semibold text-sm">Swaps</div>
            <div className="text-blue-900 font-bold">
              {analytics.swapTransactions}
            </div>
          </div>
          <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
            <div className="text-gray-700 font-semibold text-sm">
              Fees Spent
            </div>
            <div className="text-gray-900 font-bold font-mono text-xs">
              {analytics.totalFeesSpent.toFixed(4)} SOL
            </div>
          </div>
        </div>
      )}

      {/* Transactions Table */}
      {filteredTransactions.length > 0 ? (
        <div className="bg-white rounded-lg border">
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <TableHead
                      key={header.id}
                      className="cursor-pointer hover:bg-muted/50"
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
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <div className="bg-white rounded-lg border p-6 text-center">
          <p className="text-gray-500">No recent transactions found</p>
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
            Page {table.getState().pagination.pageIndex + 1} of{" "}
            {table.getPageCount()}
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
        Showing{" "}
        {table.getState().pagination.pageIndex *
          table.getState().pagination.pageSize +
          1}
        -
        {Math.min(
          (table.getState().pagination.pageIndex + 1) *
            table.getState().pagination.pageSize,
          filteredTransactions.length
        )}{" "}
        of {filteredTransactions.length} transaction
        {filteredTransactions.length !== 1 ? "s" : ""} • Data updated at{" "}
        {new Date().toLocaleTimeString()}
      </div>
    </div>
  );
};
