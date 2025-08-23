import { ArrowUpDown, Loader2, RefreshCw } from "lucide-react";
import { Button } from "../ui/button";
import { SwapIntent } from "@/lib/types";
import { Loader } from "@/components/prompt-kit/loader";

interface Token {
  address: string;
  symbol: string;
  decimals: number;
}

interface SwapDetailsProps {
  swapIntent: SwapIntent;
  inputToken: Token;
  outputToken: Token;
  isLoading: boolean;
  onRefresh: () => void;
  formatOutputAmount: () => string;
}

export function SwapDetails({
  swapIntent,
  inputToken,
  outputToken,
  isLoading,
  onRefresh,
  formatOutputAmount,
}: SwapDetailsProps) {
  return (
    <>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <ArrowUpDown className="w-5 h-5 text-purple-600 dark:text-purple-400" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Token Swap
          </h3>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={onRefresh}
          disabled={isLoading}
          className="text-xs"
        >
          {isLoading ? (
            <Loader2 className="w-3 h-3 animate-spin" />
          ) : (
            <RefreshCw className="w-3 h-3" />
          )}
          Refresh
        </Button>
      </div>

      {/* Swap Details */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-4 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Input */}
          <div>
            <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
              From
            </label>
            <div className="mt-1">
              <div className="text-lg font-semibold text-gray-900 dark:text-white">
                {swapIntent.amount} {inputToken.symbol}
              </div>
            </div>
          </div>

          {/* Output */}
          <div>
            <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
              To (Estimated)
            </label>
            <div className="mt-1">
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <Loader variant="circular" size="sm" />
                  <span className="text-sm text-gray-500">Loading...</span>
                </div>
              ) : (
                <div className="text-lg font-semibold text-gray-900 dark:text-white">
                  {formatOutputAmount()} {outputToken.symbol}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
