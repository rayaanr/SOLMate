"use client";

import { useSignAndSendTransaction } from "@web3auth/modal/react/solana";
import { useJupiter } from "@/providers/JupProvider";
import { Button } from "../ui/button";
import { SwapDetails } from "./SwapDetails";
import { QuoteDetails } from "./QuoteDetails";
import { SwapStatusMessage } from "./SwapStatusMessage";
import { useSwap } from "../../hooks/useSwap";
import {
  ArrowUpDown,
  Loader2,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";

interface SwapIntent {
  type: "swap";
  inputToken: string;
  outputToken: string;
  amount: number;
}

interface SwapActionsProps {
  swapIntent: SwapIntent;
  onSwapComplete?: (signature: string) => void;
}


export function SwapActions({ swapIntent, onSwapComplete }: SwapActionsProps) {
  const { loading: isPending } = useSignAndSendTransaction();
  const { userPublicKey } = useJupiter();
  
  // Use custom hook
  const {
    localError,
    status,
    isLoading,
    quoteResponse,
    lastRefreshTimestamp,
    inputToken,
    outputToken,
    executeSwap,
    fetchQuote,
    formatOutputAmount,
    getPriceImpact,
    error,
    hash,
  } = useSwap({ swapIntent, onSwapComplete });

  if (!inputToken || !outputToken) {
    return (
      <div className="bg-gradient-to-r from-red-50 to-pink-50 dark:from-red-900/20 dark:to-pink-900/20 border border-red-200 dark:border-red-700 rounded-xl p-6">
        <div className="flex items-center space-x-2 text-red-700 dark:text-red-300">
          <AlertCircle className="w-5 h-5" />
          <span className="font-medium">Unsupported Token</span>
        </div>
        <p className="text-red-600 dark:text-red-400 mt-2">
          One or more tokens are not supported. Supported tokens: SOL, USDC,
          USDT, BONK, RAY
        </p>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 border border-purple-200 dark:border-purple-700 rounded-xl p-6 space-y-4">
      <SwapDetails
        swapIntent={swapIntent}
        inputToken={inputToken}
        outputToken={outputToken}
        isLoading={isLoading}
        onRefresh={fetchQuote}
        formatOutputAmount={formatOutputAmount}
      />
      
      <QuoteDetails
        quoteResponse={quoteResponse}
        isLoading={isLoading}
        getPriceImpact={getPriceImpact}
        lastRefreshTimestamp={lastRefreshTimestamp}
      />

      <SwapStatusMessage
        localError={localError}
        error={error}
        status={status}
        hash={hash}
      />

      {/* Action Button */}
      <div className="flex justify-end pt-2">
        <Button
          onClick={executeSwap}
          disabled={
            !quoteResponse ||
            !userPublicKey ||
            isPending ||
            isLoading ||
            status === "success"
          }
          className="bg-purple-600 hover:bg-purple-700 text-white px-6"
        >
          {isPending ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
              Executing Swap...
            </>
          ) : status === "success" ? (
            <>
              <CheckCircle2 className="w-4 h-4 mr-2" />
              Swap Completed
            </>
          ) : (
            <>
              <ArrowUpDown className="w-4 h-4 mr-2" />
              Execute Swap
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
