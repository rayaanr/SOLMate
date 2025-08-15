import React from "react";
import ReactMarkdown from "react-markdown";
import { parseMessageData } from "@/lib/message-utils";
import { TransactionActions } from "../txns/TransactionActions";
import { SwapActions } from "../swap/SwapActions";
import { TransactionPreparingCard } from "../txns/TransactionPreparingCard";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface ChatMessageProps {
  message: Message;
  index: number;
  onTransactionComplete?: (signature: string) => void;
  onSwapComplete?: (signature: string) => void;
}

export function ChatMessage({
  message,
  index,
  onTransactionComplete,
  onSwapComplete,
}: ChatMessageProps) {
  const isUser = message.role === "user";
  
  if (isUser) {
    return (
      <div key={index} className="flex justify-end">
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
    hasCompleteTransaction,
    hasCompleteSwap,
    transactionData,
    swapData,
    cleanContent,
  } = parseMessageData(message.content);

  return (
    <div key={index} className="flex justify-start">
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
      </div>
    </div>
  );
}
