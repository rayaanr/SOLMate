"use client";

import React, { useState, useMemo } from 'react';
import { Column, Table } from '@tanstack/react-table';

// Global search input component
interface GlobalFilterProps {
  globalFilter: string;
  setGlobalFilter: (value: string) => void;
  placeholder?: string;
}

export function GlobalFilter({ 
  globalFilter, 
  setGlobalFilter, 
  placeholder = "Search all columns..." 
}: GlobalFilterProps) {
  const [value, setValue] = useState(globalFilter);

  const onChange = (value: string) => {
    setValue(value);
    setGlobalFilter(value);
  };

  return (
    <div className="relative">
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      </div>
      <input
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md w-full text-sm focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
      />
      {value && (
        <button
          onClick={() => onChange("")}
          className="absolute inset-y-0 right-0 pr-3 flex items-center"
        >
          <svg className="h-4 w-4 text-gray-400 hover:text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  );
}

// Column filter for specific data types
interface ColumnFilterProps<TData> {
  column: Column<TData, unknown>;
  table: Table<TData>;
}

export function ColumnFilter<TData>({ column, table }: ColumnFilterProps<TData>) {
  const firstValue = table.getPreFilteredRowModel().flatRows[0]?.getValue(column.id);
  const columnFilterValue = column.getFilterValue();

  // Number range filter
  if (typeof firstValue === 'number') {
    return (
      <div className="flex space-x-2">
        <input
          type="number"
          value={(columnFilterValue as [number, number])?.[0] ?? ''}
          onChange={(e) =>
            column.setFilterValue((old: [number, number] | undefined) => [
              e.target.value,
              old?.[1],
            ])
          }
          placeholder="Min"
          className="w-20 px-2 py-1 text-xs border rounded focus:ring-blue-500 focus:border-blue-500"
        />
        <input
          type="number"
          value={(columnFilterValue as [number, number])?.[1] ?? ''}
          onChange={(e) =>
            column.setFilterValue((old: [number, number] | undefined) => [
              old?.[0],
              e.target.value,
            ])
          }
          placeholder="Max"
          className="w-20 px-2 py-1 text-xs border rounded focus:ring-blue-500 focus:border-blue-500"
        />
      </div>
    );
  }

  // Text filter
  return (
    <input
      type="text"
      value={(columnFilterValue ?? '') as string}
      onChange={(e) => column.setFilterValue(e.target.value)}
      placeholder="Filter..."
      className="w-full px-2 py-1 text-xs border rounded focus:ring-blue-500 focus:border-blue-500"
    />
  );
}

// Advanced filter panel component
interface AdvancedFilterPanelProps<TData> {
  table: Table<TData>;
  isOpen: boolean;
  onToggle: () => void;
}

export function AdvancedFilterPanel<TData>({ 
  table, 
  isOpen, 
  onToggle 
}: AdvancedFilterPanelProps<TData>) {
  if (!isOpen) {
    return (
      <button
        onClick={onToggle}
        className="text-sm text-blue-600 hover:text-blue-800 font-medium"
      >
        Show Filters
      </button>
    );
  }

  return (
    <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
      <div className="flex justify-between items-center mb-3">
        <h4 className="font-medium text-gray-900">Column Filters</h4>
        <button
          onClick={onToggle}
          className="text-sm text-gray-600 hover:text-gray-800"
        >
          Hide Filters
        </button>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {table.getHeaderGroups()[0]?.headers
          .filter(header => header.column.getCanFilter())
          .map(header => (
            <div key={header.id} className="space-y-1">
              <label className="block text-xs font-medium text-gray-700">
                {header.column.columnDef.header as string}
              </label>
              <ColumnFilter column={header.column} table={table} />
            </div>
          ))
        }
      </div>
      
      {/* Clear all filters button */}
      <div className="mt-3 pt-3 border-t border-gray-200">
        <button
          onClick={() => table.resetColumnFilters()}
          className="text-xs text-red-600 hover:text-red-800 font-medium"
        >
          Clear All Filters
        </button>
      </div>
    </div>
  );
}

// Quick filter buttons for common filters
interface QuickFiltersProps {
  onFilterApply: (filter: any) => void;
  filters: Array<{
    label: string;
    value: any;
    color?: string;
  }>;
}

export function QuickFilters({ onFilterApply, filters }: QuickFiltersProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {filters.map((filter, index) => (
        <button
          key={index}
          onClick={() => onFilterApply(filter.value)}
          className={`px-3 py-1 text-xs rounded-full border font-medium transition-colors ${
            filter.color || 'border-gray-300 text-gray-700 hover:bg-gray-50'
          }`}
        >
          {filter.label}
        </button>
      ))}
    </div>
  );
}

// Export/action buttons for tables
interface TableActionsProps {
  onExport?: (format: 'csv' | 'json') => void;
  selectedRows?: number;
  onBulkAction?: (action: string) => void;
  bulkActions?: Array<{
    label: string;
    action: string;
    color?: string;
  }>;
}

export function TableActions({ 
  onExport, 
  selectedRows = 0, 
  onBulkAction, 
  bulkActions = [] 
}: TableActionsProps) {
  return (
    <div className="flex items-center justify-between gap-4">
      {/* Selection info */}
      {selectedRows > 0 && (
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">
            {selectedRows} row{selectedRows !== 1 ? 's' : ''} selected
          </span>
          
          {bulkActions.length > 0 && onBulkAction && (
            <div className="flex gap-1">
              {bulkActions.map((action, index) => (
                <button
                  key={index}
                  onClick={() => onBulkAction(action.action)}
                  className={`px-2 py-1 text-xs rounded font-medium ${
                    action.color || 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                >
                  {action.label}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Export buttons */}
      {onExport && (
        <div className="flex gap-2">
          <button
            onClick={() => onExport('csv')}
            className="px-3 py-1 text-xs border border-gray-300 rounded hover:bg-gray-50 font-medium"
          >
            Export CSV
          </button>
          <button
            onClick={() => onExport('json')}
            className="px-3 py-1 text-xs border border-gray-300 rounded hover:bg-gray-50 font-medium"
          >
            Export JSON
          </button>
        </div>
      )}
    </div>
  );
}

// Custom filter functions for specific data types
export const customFilterFns = {
  // Price range filter
  priceRange: (row: any, columnId: string, value: [number, number]) => {
    const price = parseFloat(row.getValue(columnId));
    const [min, max] = value;
    return (!min || price >= min) && (!max || price <= max);
  },
  
  // Date range filter
  dateRange: (row: any, columnId: string, value: [Date, Date]) => {
    const date = new Date(row.getValue(columnId));
    const [start, end] = value;
    return (!start || date >= start) && (!end || date <= end);
  },
  
  // Transaction type filter
  transactionType: (row: any, columnId: string, value: string[]) => {
    const type = row.getValue(columnId);
    return value.length === 0 || value.includes(type);
  },
  
  // Token symbol filter (case insensitive)
  tokenSymbol: (row: any, columnId: string, value: string) => {
    const symbol = row.getValue(columnId)?.toLowerCase();
    return !value || symbol?.includes(value.toLowerCase());
  },
};
