import { useState, useEffect, useMemo, useCallback } from 'react';
import { useJupiter } from '@/providers/JupProvider';
import { useSignAndSendTransaction } from '@web3auth/modal/react/solana';
import { VersionedTransaction } from '@solana/web3.js';
import { Buffer } from 'buffer';
import { getTokenBySymbol } from '@/data/tokens';
import { SwapIntent } from '@/lib/types';

interface Token {
  address: string;
  symbol: string;
  decimals: number;
}

interface UseSwapParams {
  swapIntent: SwapIntent;
  onSwapComplete?: (signature: string) => void;
}

interface UseSwapReturn {
  localError: string | null;
  status: 'idle' | 'success' | 'error';
  isLoading: boolean;
  quoteResponse: any;
  lastRefreshTimestamp: number | null;
  inputToken: Token | undefined;
  outputToken: Token | undefined;
  executeSwap: () => Promise<void>;
  fetchQuote: () => Promise<void>;
  formatOutputAmount: () => string;
  getPriceImpact: () => string;
  error: any;
  hash: string | null;
}


export function useSwap({ swapIntent, onSwapComplete }: UseSwapParams): UseSwapReturn {
  // State
  const [localError, setLocalError] = useState<string | null>(null);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [isLoading, setIsLoading] = useState(false);
  const [quoteResponse, setQuoteResponse] = useState<any>(null);
  const [lastRefreshTimestamp, setLastRefreshTimestamp] = useState<number | null>(null);

  // Hooks
  const {
    data: hash,
    error,
    loading: isPending,
    signAndSendTransaction,
  } = useSignAndSendTransaction();
  const { jupiterApi, userPublicKey } = useJupiter();

  // Memoized token lookups using centralized data
  const inputToken = useMemo(() => {
    return getTokenBySymbol(swapIntent.inputToken);
  }, [swapIntent.inputToken]);

  const outputToken = useMemo(() => {
    return getTokenBySymbol(swapIntent.outputToken);
  }, [swapIntent.outputToken]);

  // Memoized amount calculation
  const amountInLamports = useMemo(() => {
    return swapIntent.amount && inputToken
      ? Math.floor(swapIntent.amount * Math.pow(10, inputToken.decimals))
      : 0;
  }, [swapIntent.amount, inputToken]);

  // Memoized validation
  const isValidSwap = useMemo(() => {
    return (
      inputToken &&
      outputToken &&
      amountInLamports > 0 &&
      inputToken.address !== outputToken.address
    );
  }, [inputToken, outputToken, amountInLamports]);

  // Memoized format functions
  const formatOutputAmount = useCallback(() => {
    if (!quoteResponse?.outAmount || !outputToken) return '0';
    const outAmount = parseInt(quoteResponse.outAmount);
    return (outAmount / Math.pow(10, outputToken.decimals)).toFixed(6);
  }, [quoteResponse, outputToken]);

  const getPriceImpact = useCallback(() => {
    if (!quoteResponse?.priceImpactPct) return '0%';
    return `${parseFloat(quoteResponse.priceImpactPct).toFixed(4)}%`;
  }, [quoteResponse]);

  // Optimized fetch quote function
  const fetchQuote = useCallback(async () => {
    if (!isValidSwap || !jupiterApi) {
      setQuoteResponse(null);
      return;
    }

    setIsLoading(true);
    setLocalError(null);
    setStatus('idle');

    try {
      const normalizedAmount =
        typeof amountInLamports === 'bigint' ? Number(amountInLamports) : amountInLamports;
        
      if (!normalizedAmount || normalizedAmount <= 0) {
        setLocalError('Invalid amount for quote. Please provide a positive amount.');
        setQuoteResponse(null);
        return;
      }

      const quote = await jupiterApi.quoteGet({
        inputMint: inputToken!.address,
        outputMint: outputToken!.address,
        amount: normalizedAmount,
        slippageBps: 100, // 1% slippage
      });

      setQuoteResponse(quote);
      setLastRefreshTimestamp(Date.now());
    } catch (err: unknown) {
      console.error('Quote fetch error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch quote';
      setLocalError(errorMessage);
      setQuoteResponse(null);
    } finally {
      setIsLoading(false);
    }
  }, [isValidSwap, jupiterApi, inputToken, outputToken, amountInLamports]);

  // Optimized execute swap function
  const executeSwap = useCallback(async () => {
    if (!quoteResponse || !userPublicKey || !jupiterApi) {
      setLocalError('No quote available or wallet not connected');
      return;
    }

    setLocalError(null);
    setStatus('idle');

    try {
      const swapResult = await jupiterApi.swapPost({
        swapRequest: {
          quoteResponse,
          userPublicKey: userPublicKey.toString(),
          wrapAndUnwrapSol: true,
          prioritizationFeeLamports: {
            priorityLevelWithMaxLamports: {
              maxLamports: 1000000, // 0.001 SOL
              priorityLevel: 'medium',
            },
          },
        },
      });

      if (swapResult.swapTransaction) {
        const swapTransactionBuf = Buffer.from(swapResult.swapTransaction, 'base64');
        const transaction = VersionedTransaction.deserialize(swapTransactionBuf);
        await signAndSendTransaction(transaction);
      } else {
        setLocalError('Failed to create swap transaction');
        setStatus('error');
      }
    } catch (err: unknown) {
      console.error('Swap error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Swap failed';
      setLocalError(errorMessage);
      setStatus('error');
    }
  }, [quoteResponse, userPublicKey, jupiterApi, signAndSendTransaction]);

  // Auto-fetch quote when parameters change
  useEffect(() => {
    if (isValidSwap) {
      fetchQuote();
    }
  }, [fetchQuote, isValidSwap]);

  // Handle Web3Auth transaction states
  useEffect(() => {
    if (hash && status !== 'success') {
      setStatus('success');
      if (onSwapComplete) {
        onSwapComplete(hash);
      }
    }
  }, [hash, onSwapComplete, status]);

  useEffect(() => {
    if (error && status !== 'error') {
      setStatus('error');
      setLocalError(error.message || 'Transaction failed');
    }
  }, [error, status]);

  return {
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
  };
}
