"use client";

import React, { useState } from "react";
import { useUserWallet } from "@/contexts/UserWalletContext";
import { useWalletData, useWalletDataActions } from "@/hooks/useWalletData";
import { TokenPortfolioTable } from "./TokenPortfolioTable";
import { Button } from "@/components/ui/button";
import { RefreshCw, Search } from "lucide-react";

export const PortfolioPanel: React.FC = () => {
  const { userWallet } = useUserWallet();
  const [globalFilter, setGlobalFilter] = useState("");
  
  const { 
    data: portfolioData, 
    isLoading, 
    error
  } = useWalletData(userWallet);
  
  const { refresh } = useWalletDataActions();

  const handleRefresh = () => {
    if (userWallet) {
      refresh(userWallet);
    } else {
      refresh();
    }
  };

  const formatLastUpdated = (updatedAt?: string) => {
    if (!updatedAt) return "";
    
    const date = new Date(updatedAt);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) {
      return `Updated ${diffInSeconds}s ago`;
    } else if (diffInSeconds < 3600) {
      return `Updated ${Math.floor(diffInSeconds / 60)}m ago`;
    } else {
      return `Updated ${Math.floor(diffInSeconds / 3600)}h ago`;
    }
  };

  // Calculate total portfolio value
  const totalPortfolioValue = React.useMemo(() => {
    if (!portfolioData) return 0;
    
    const tokenValue = portfolioData.tokens.reduce((sum, token) => {
      return sum + (parseFloat(token.usd_value) || 0);
    }, 0);
    
    const solValue = parseFloat(portfolioData.native_balance.usd_value) || 0;
    
    return tokenValue + solValue;
  }, [portfolioData]);

  const formatUSD = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  return (
    <div className="bg-white border rounded-lg shadow-sm h-fit">
      {/* Header */}
      <div className="border-b p-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold">Portfolio</h2>
            {portfolioData && (
              <p className="text-2xl font-bold text-green-600 mt-1">
                {formatUSD(totalPortfolioValue)}
              </p>
            )}
          </div>
          <Button
            onClick={handleRefresh}
            variant="outline"
            size="sm"
            disabled={isLoading}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
        
        {/* Search Input */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search tokens..."
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            aria-label="Search tokens"
          />
        </div>
        
        {/* Status */}
        <div className="flex items-center justify-between mt-3 text-xs text-gray-500">
          <span>{formatLastUpdated(portfolioData?.updatedAt)}</span>
          <span>Auto-refresh: 30s</span>
        </div>
      </div>

      {/* SOL Balance Section (if available) */}
      {portfolioData && parseFloat(portfolioData.native_balance.solana) > 0 && (
        <div className="p-4 border-b bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-purple-500 flex items-center justify-center text-white text-xs font-semibold">
                SOL
              </div>
              <div>
                <div className="font-medium text-sm">Solana</div>
                <div className="text-xs text-gray-500">Native Balance</div>
              </div>
            </div>
            <div className="text-right">
              <div className="font-medium text-sm">
                {formatUSD(parseFloat(portfolioData.native_balance.usd_value))}
              </div>
              <div className="text-xs text-gray-500">
                {parseFloat(portfolioData.native_balance.solana).toFixed(4)} SOL
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="overflow-hidden">
        <TokenPortfolioTable
          data={portfolioData?.tokens}
          loading={isLoading}
          error={error}
          onRefresh={handleRefresh}
          globalFilter={globalFilter}
          onGlobalFilterChange={setGlobalFilter}
        />
      </div>
      
      {/* Footer */}
      {portfolioData && portfolioData.tokens.length > 0 && (
        <div className="border-t p-3 text-center text-xs text-gray-500">
          {portfolioData.tokens.length} token{portfolioData.tokens.length !== 1 ? 's' : ''} • 
          Prices updated every 30 seconds
        </div>
      )}
    </div>
  );
};
