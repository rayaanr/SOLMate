"use client";

import { useState, useEffect, useCallback } from "react";
import { useJupiter } from "@/providers/JupProvider";
import { useSignAndSendTransaction } from "@web3auth/modal/react/solana";
import { VersionedTransaction } from "@solana/web3.js";
import { Button } from "./ui/button";
import { ArrowUpDown, Loader2, AlertCircle, CheckCircle2, RefreshCw } from "lucide-react";

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

// Token configurations
const tokens = {
  SOL: {
    address: "So11111111111111111111111111111111111111112",
    symbol: "SOL",
    decimals: 9,
  },
  USDC: {
    address: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
    symbol: "USDC",
    decimals: 6,
  },
  USDT: {
    address: "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB",
    symbol: "USDT",
    decimals: 6,
  },
  BONK: {
    address: "DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263",
    symbol: "BONK",
    decimals: 5,
  },
  RAY: {
    address: "4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R",
    symbol: "RAY",
    decimals: 6,
  },
};

export function SwapActions({ swapIntent, onSwapComplete }: SwapActionsProps) {
  const {
    data: hash,
    error,
    loading: isPending,
    signAndSendTransaction,
  } = useSignAndSendTransaction();
  const { jupiterApi, userPublicKey } = useJupiter();

  // State
  const [localError, setLocalError] = useState<string | null>(null);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [isLoading, setIsLoading] = useState(false);
  const [quoteResponse, setQuoteResponse] = useState<any>(null);
  const [lastRefreshTimestamp, setLastRefreshTimestamp] = useState<number | null>(null);

  // Get token configurations
  const getTokenBySymbol = (symbol: string) => {
    const upperSymbol = symbol.toUpperCase();
    return Object.values(tokens).find((t) => t.symbol === upperSymbol);
  };

  const inputToken = getTokenBySymbol(swapIntent.inputToken);
  const outputToken = getTokenBySymbol(swapIntent.outputToken);

  const amountInLamports = swapIntent.amount && inputToken
    ? Math.floor(swapIntent.amount * Math.pow(10, inputToken.decimals))
    : 0;

  // Fetch quote from Jupiter API
  const fetchQuote = useCallback(async () => {
    if (!inputToken || !outputToken || !amountInLamports || inputToken.address === outputToken.address) {
      setQuoteResponse(null);
      return;
    }

    setIsLoading(true);
    setLocalError(null);

    try {
      const quote = await jupiterApi.quoteGet({
        inputMint: inputToken.address,
        outputMint: outputToken.address,
        amount: amountInLamports,
        slippageBps: 100, // 1% slippage
      });

      setQuoteResponse(quote);
      setLastRefreshTimestamp(Date.now());
    } catch (err: unknown) {
      console.error("Quote fetch error:", err);
      const errorMessage = err instanceof Error ? err.message : "Failed to fetch quote";
      setLocalError(errorMessage);
      setQuoteResponse(null);
    } finally {
      setIsLoading(false);
    }
  }, [jupiterApi, inputToken, outputToken, amountInLamports]);

  // Execute swap
  const executeSwap = async () => {
    if (!quoteResponse || !userPublicKey) {
      setLocalError("No quote available or wallet not connected");
      return;
    }

    setLocalError(null);
    setStatus("idle");

    try {
      // Get swap transaction
      const swapResult = await jupiterApi.swapPost({
        swapRequest: {
          quoteResponse,
          userPublicKey: userPublicKey.toString(),
          wrapAndUnwrapSol: true,
          prioritizationFeeLamports: {
            priorityLevelWithMaxLamports: {
              maxLamports: 1000000, // 0.001 SOL
              priorityLevel: "medium",
            },
          },
        },
      });

      if (swapResult.swapTransaction) {
        // Deserialize the transaction
        const swapTransactionBuf = Buffer.from(swapResult.swapTransaction, "base64");
        const transaction = VersionedTransaction.deserialize(swapTransactionBuf);

        // Sign and send the transaction
        const signature = await signAndSendTransaction(transaction);
        setStatus("success");
        if (onSwapComplete && signature) {
          onSwapComplete(signature);
        }
      } else {
        setLocalError("Failed to create swap transaction");
        setStatus("error");
      }
    } catch (err: unknown) {
      console.error("Swap error:", err);
      const errorMessage = err instanceof Error ? err.message : "Swap failed";
      setLocalError(errorMessage);
      setStatus("error");
    }
  };

  // Format output amount from quote
  const formatOutputAmount = () => {
    if (!quoteResponse?.outAmount || !outputToken) return "0";
    const outAmount = parseInt(quoteResponse.outAmount);
    return (outAmount / Math.pow(10, outputToken.decimals)).toFixed(6);
  };

  // Format price impact
  const getPriceImpact = () => {
    if (!quoteResponse?.priceImpactPct) return "0%";
    return `${(parseFloat(quoteResponse.priceImpactPct) * 100).toFixed(4)}%`;
  };

  // Auto-fetch quote on mount and when parameters change
  useEffect(() => {
    if (inputToken && outputToken && amountInLamports > 0) {
      fetchQuote();
    }
  }, [fetchQuote]);

  // Handle Web3Auth transaction states
  useEffect(() => {
    if (hash) {
      setStatus("success");
      if (onSwapComplete) {
        onSwapComplete(hash);
      }
    }
  }, [hash, onSwapComplete]);

  useEffect(() => {
    if (error) {
      setStatus("error");
      setLocalError(error.message || "Transaction failed");
    }
  }, [error]);

  if (!inputToken || !outputToken) {
    return (
      <div className="bg-gradient-to-r from-red-50 to-pink-50 dark:from-red-900/20 dark:to-pink-900/20 border border-red-200 dark:border-red-700 rounded-xl p-6">
        <div className="flex items-center space-x-2 text-red-700 dark:text-red-300">
          <AlertCircle className="w-5 h-5" />
          <span className="font-medium">Unsupported Token</span>
        </div>
        <p className="text-red-600 dark:text-red-400 mt-2">
          One or more tokens are not supported. Supported tokens: SOL, USDC, USDT, BONK, RAY
        </p>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 border border-purple-200 dark:border-purple-700 rounded-xl p-6 space-y-4">
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
          onClick={fetchQuote}
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
                <div className="animate-pulse h-6 bg-gray-200 dark:bg-gray-600 rounded w-20"></div>
              ) : (
                <div className="text-lg font-semibold text-gray-900 dark:text-white">
                  {formatOutputAmount()} {outputToken.symbol}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Quote Details */}
        {quoteResponse && !isLoading && (
          <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-500 dark:text-gray-400">Price Impact:</span>
                <span className="ml-2 font-medium text-gray-900 dark:text-white">
                  {getPriceImpact()}
                </span>
              </div>
              <div>
                <span className="text-gray-500 dark:text-gray-400">Slippage:</span>
                <span className="ml-2 font-medium text-gray-900 dark:text-white">1%</span>
              </div>
            </div>
            {lastRefreshTimestamp && (
              <div className="mt-2 text-xs text-gray-400">
                Last updated: {new Date(lastRefreshTimestamp).toLocaleTimeString()}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Error Display */}
      {(localError || error) && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 text-red-500" />
            <p className="text-sm text-red-700 dark:text-red-300">
              {localError || error?.message}
            </p>
          </div>
        </div>
      )}

      {/* Success Display */}
      {status === "success" && hash && (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-green-500" />
            <p className="text-sm text-green-700 dark:text-green-300">
              Swap completed successfully!
            </p>
          </div>
          <p className="text-xs text-green-600 dark:text-green-400 mt-1 font-mono break-all">
            {hash}
          </p>
        </div>
      )}

      {/* Action Button */}
      <div className="flex justify-end pt-2">
        <Button
          onClick={executeSwap}
          disabled={!quoteResponse || isPending || isLoading || status === "success"}
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
