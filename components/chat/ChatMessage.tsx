import React from "react";
import ReactMarkdown from "react-markdown";
import { parseMessageData } from "@/services/utils/message-utils";
import { TransactionActions } from "../txns/TransactionActions";
import { SwapActions } from "../swap/SwapActions";
import { TransactionPreparingCard } from "../txns/TransactionPreparingCard";
import { MessagePortfolioTable } from "./MessagePortfolioTable";
import { MessageTransactionTable } from "./MessageTransactionTable";
import { MessageNFTGrid } from "../nfts/MessageNFTGrid";
import { MessageMarketData } from "@/src/components/market/MessageMarketData";
import { Message } from "@/hooks/useChat";

interface ChatMessageProps {
  message: Message;
  onTransactionComplete?: (signature: string) => void;
  onSwapComplete?: (signature: string) => void;
}

export function ChatMessage({
  message,
  onTransactionComplete,
  onSwapComplete,
}: ChatMessageProps) {
  const isUser = message.role === "user";
  
  if (isUser) {
    return (
      <div key={message.id} className="flex justify-end">
        <div className="max-w-3xl px-4 py-3 rounded-2xl bg-gray-900 dark:bg-white text-white dark:text-gray-900">
          <p className="whitespace-pre-wrap">{message.content}</p>
        </div>
      </div>
    );
  }

  // Parse AI message data
  const {
    isTransactionPreparing,
    isSwapPreparing,
    isPortfolioPreparing,
    isTransactionHistoryPreparing,
    isNftPreparing,
    isMarketPreparing,
    hasCompleteTransaction,
    hasCompleteSwap,
    hasCompletePortfolio,
    hasCompleteTransactionHistory,
    hasCompleteNfts,
    hasCompleteMarket,
    transactionData,
    swapData,
    portfolioData,
    transactionHistoryData,
    nftData,
    marketData,
    cleanContent,
  } = parseMessageData(message.content);

  return (
    <div key={message.id} className="flex justify-start">
      <div className="max-w-3xl px-4 py-3 rounded-2xl bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white">
        {/* Main response content */}
        <div className="prose dark:prose-invert max-w-none">
          <ReactMarkdown>{cleanContent}</ReactMarkdown>
        </div>

        {/* Transaction preparation loading */}
        {isTransactionPreparing && (
          <TransactionPreparingCard type="transaction" />
        )}

        {/* Swap preparation loading */}
        {isSwapPreparing && (
          <TransactionPreparingCard type="swap" />
        )}

        {/* Portfolio preparation loading */}
        {isPortfolioPreparing && (
          <div className="mt-4">
            <div className="animate-pulse flex items-center gap-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
              <div className="w-5 h-5 bg-blue-400 rounded-full"></div>
              <div className="flex-1">
                <div className="h-4 bg-blue-200 rounded w-32 mb-1"></div>
                <div className="h-3 bg-blue-100 rounded w-48"></div>
              </div>
            </div>
          </div>
        )}

        {/* Transaction history preparation loading */}
        {isTransactionHistoryPreparing && (
          <div className="mt-4">
            <div className="animate-pulse flex items-center gap-3 p-3 bg-green-50 rounded-lg border border-green-200">
              <div className="w-5 h-5 bg-green-400 rounded-full"></div>
              <div className="flex-1">
                <div className="h-4 bg-green-200 rounded w-40 mb-1"></div>
                <div className="h-3 bg-green-100 rounded w-52"></div>
              </div>
            </div>
          </div>
        )}

        {/* NFT preparation loading */}
        {isNftPreparing && (
          <div className="mt-4">
            <div className="animate-pulse flex items-center gap-3 p-3 bg-purple-50 rounded-lg border border-purple-200">
              <div className="w-5 h-5 bg-purple-400 rounded-full"></div>
              <div className="flex-1">
                <div className="h-4 bg-purple-200 rounded w-40 mb-1"></div>
                <div className="h-3 bg-purple-100 rounded w-56"></div>
              </div>
            </div>
          </div>
        )}

        {/* Market data preparation loading */}
        {isMarketPreparing && (
          <div className="mt-4">
            <div className="animate-pulse flex items-center gap-3 p-3 bg-orange-50 rounded-lg border border-orange-200">
              <div className="w-5 h-5 bg-orange-400 rounded-full"></div>
              <div className="flex-1">
                <div className="h-4 bg-orange-200 rounded w-40 mb-1"></div>
                <div className="h-3 bg-orange-100 rounded w-60"></div>
              </div>
            </div>
          </div>
        )}

        {/* Complete transaction UI card */}
        {hasCompleteTransaction && transactionData && (
          <div className="mt-4">
            <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                💳 <strong>Transaction Ready</strong> - Review the details below and approve when ready
              </p>
            </div>
            <TransactionActions
              transactionIntent={transactionData}
              onTransactionComplete={onTransactionComplete}
            />
          </div>
        )}

        {/* Complete swap UI card */}
        {hasCompleteSwap && swapData && (
          <div className="mt-4">
            <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                🔄 <strong>Swap Ready</strong> - Review the details below and execute when ready
              </p>
            </div>
            <SwapActions
              swapIntent={swapData}
              onSwapComplete={onSwapComplete}
            />
          </div>
        )}

        {/* Complete portfolio table */}
        {hasCompletePortfolio && portfolioData && (
          <MessagePortfolioTable
            tokens={portfolioData.tokens}
            nativeBalance={portfolioData.native_balance}
          />
        )}

        {/* Complete transaction history table */}
        {hasCompleteTransactionHistory && transactionHistoryData && (
          <MessageTransactionTable
            transactions={transactionHistoryData.transactions}
          />
        )}

        {/* Complete NFT grid */}
        {hasCompleteNfts && nftData && (
          <MessageNFTGrid nfts={nftData.nfts} />
        )}

        {/* Complete market data table */}
        {hasCompleteMarket && (
          <MessageMarketData marketData={marketData} isLoading={false} />
        )}
      </div>
    </div>
  );
}
