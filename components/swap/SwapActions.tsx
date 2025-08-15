"use client";

import { useState, useEffect, useCallback } from "react";
import { useJupiter } from "@/providers/JupProvider";
import { useSignAndSendTransaction } from "@web3auth/modal/react/solana";
import { VersionedTransaction } from "@solana/web3.js";
import { Button } from "../generic/button";
import { SwapDetails } from "./SwapDetails";
import { QuoteDetails } from "./QuoteDetails";
import { SwapStatusMessage } from "./SwapStatusMessage";
import { Buffer } from "buffer";
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
  const [lastRefreshTimestamp, setLastRefreshTimestamp] = useState<
    number | null
  >(null);

  // Get token configurations
  const getTokenBySymbol = (symbol: string) => {
    const upperSymbol = symbol.toUpperCase();
    return Object.values(tokens).find((t) => t.symbol === upperSymbol);
  };

  const inputToken = getTokenBySymbol(swapIntent.inputToken);
  const outputToken = getTokenBySymbol(swapIntent.outputToken);

  const amountInLamports =
    swapIntent.amount && inputToken
      ? Math.floor(swapIntent.amount * Math.pow(10, inputToken.decimals))
      : 0;

  // Fetch quote from Jupiter API
  const fetchQuote = useCallback(async () => {
    if (
      !inputToken ||
      !outputToken ||
      amountInLamports <= 0 ||
      inputToken.address === outputToken.address
    ) {
      setQuoteResponse(null);
      return;
    }

    setIsLoading(true);
    setLocalError(null);
    setStatus("idle");

    try {
      // Validate amount before requesting quote
      const normalizedAmount =
        typeof amountInLamports === "bigint" ? Number(amountInLamports) : amountInLamports;
      if (!normalizedAmount || normalizedAmount <= 0) {
        setLocalError("Invalid amount for quote. Please provide a positive amount.");
        setQuoteResponse(null);
        setIsLoading(false);
        return;
      }
      const quote = await jupiterApi.quoteGet({
        inputMint: inputToken.address,
        outputMint: outputToken.address,
        amount: normalizedAmount,
        slippageBps: 100, // 1% slippage
      });

      setQuoteResponse(quote);
      setLastRefreshTimestamp(Date.now());
    } catch (err: unknown) {
      console.error("Quote fetch error:", err);
      const errorMessage =
        err instanceof Error ? err.message : "Failed to fetch quote";
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
        const swapTransactionBuf = Buffer.from(
          swapResult.swapTransaction,
          "base64"
        );
        const transaction =
          VersionedTransaction.deserialize(swapTransactionBuf);

        // Sign and send the transaction
        await signAndSendTransaction(transaction);
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
