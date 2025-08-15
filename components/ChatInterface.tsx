"use client";

import React from "react";
import { ArrowUpIcon } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { useChat } from "@/lib/useChat";
import { TransactionActions } from "./TransactionActions";
import { SwapActions } from "./SwapActions";
import { useSolanaWallet } from "@web3auth/modal/react/solana";

const ChatInterface = () => {
  // Get Web3Auth wallet
  const { accounts } = useSolanaWallet();
  const userWallet = accounts && accounts.length > 0 ? accounts[0] : undefined;

  // Set userWallet globally whenever it changes
  React.useEffect(() => {
    (window as any).userWallet = userWallet;
  }, [userWallet]);

  const { messages, input, handleInputChange, handleSubmit, isLoading } =
    useChat({
      api: "/api/chat",
      onError: (error) => {
        console.error("Chat error:", error);
      },
    });

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    // Use the AI chat submit
    handleSubmit(e);
  };

  const handleTransactionComplete = (signature: string) => {
    console.log("Transaction completed:", signature);
    // You could add a success message to the chat here
  };

  const handleSwapComplete = (signature: string) => {
    console.log("Swap completed:", signature);
    // You could add a success message to the chat here
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      {messages.length === 0 ? (
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-6xl font-normal mb-8 text-gray-900 dark:text-white">
            What's on your mind?
          </h1>

          {/* Chat Input */}
          <form onSubmit={handleFormSubmit} className="relative mb-8">
            <div className="relative bg-gray-50 dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 focus-within:border-gray-400 dark:focus-within:border-gray-500 transition-colors">
              <textarea
                value={input}
                onChange={handleInputChange}
                placeholder="Ask SOLMate about Solana development, or say 'Send 5 USDC to alice.sol'..."
                className="w-full px-4 py-4 pr-16 bg-transparent resize-none border-none outline-none text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                rows={1}
                style={{ minHeight: "60px" }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleFormSubmit(e as React.FormEvent);
                  }
                }}
              />
              <div className="absolute bottom-3 right-3">
                <button
                  type="submit"
                  disabled={!input.trim() || isLoading}
                  className="p-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-lg hover:bg-gray-700 dark:hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ArrowUpIcon size={20} />
                </button>
              </div>
            </div>
          </form>

          {/* Simple intro text */}
          <div className="text-center">
            <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Ask me anything about Solana development, check wallet balances,
              or send transactions like "Send 5 USDC to alice.sol"
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Conversation History */}
          <div className="space-y-6">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex ${
                  message.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`max-w-3xl px-4 py-3 rounded-2xl ${
                    message.role === "user"
                      ? "bg-gray-900 dark:bg-white text-white dark:text-gray-900"
                      : "bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white"
                  }`}
                >
                  {message.role === "user" ? (
                    <p className="whitespace-pre-wrap">{message.content}</p>
                  ) : (
                    <div>
                      {(() => {
                        // Check for transaction data states
                        const hasTransactionStart =
                          message.content.includes("[TRANSACTION_DATA]");
                        const hasTransactionEnd = message.content.includes(
                          "[/TRANSACTION_DATA]"
                        );
                        const transactionMatch = message.content.match(
                          /\[TRANSACTION_DATA\](.*?)\[\/TRANSACTION_DATA\]/
                        );
                        const hasCompleteTransaction =
                          transactionMatch !== null;

                        // Check for swap data states
                        const hasSwapStart =
                          message.content.includes("[SWAP_DATA]");
                        const hasSwapEnd =
                          message.content.includes("[/SWAP_DATA]");
                        const swapMatch = message.content.match(
                          /\[SWAP_DATA\](.*?)\[\/SWAP_DATA\]/
                        );
                        const hasCompleteSwap = swapMatch !== null;

                        // Check if transaction is being prepared (started but not finished)
                        const isTransactionPreparing =
                          hasTransactionStart && !hasTransactionEnd;
                        const isSwapPreparing = hasSwapStart && !hasSwapEnd;

                        // Clean content without transaction/swap data (including partial streaming)
                        let cleanContent = message.content;

                        // Remove complete transaction data blocks
                        cleanContent = cleanContent.replace(
                          /\[TRANSACTION_DATA\].*?\[\/TRANSACTION_DATA\]/g,
                          ""
                        );

                        // Remove complete swap data blocks
                        cleanContent = cleanContent.replace(
                          /\[SWAP_DATA\].*?\[\/SWAP_DATA\]/g,
                          ""
                        );

                        // Remove partial transaction data that's still streaming (starts with [TRANSACTION_DATA] but no end tag yet)
                        cleanContent = cleanContent.replace(
                          /\[TRANSACTION_DATA\].*$/g,
                          ""
                        );

                        // Remove partial swap data that's still streaming (starts with [SWAP_DATA] but no end tag yet)
                        cleanContent = cleanContent.replace(
                          /\[SWAP_DATA\].*$/g,
                          ""
                        );

                        // Trim the result
                        cleanContent = cleanContent.trim();

                        return (
                          <>
                            {/* Main response content */}
                            <div className="prose dark:prose-invert max-w-none">
                              <ReactMarkdown>{cleanContent}</ReactMarkdown>
                            </div>

                            {/* Transaction preparation loading */}
                            {isTransactionPreparing && (
                              <div className="mt-4">
                                <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-700 rounded-xl p-5 space-y-4">
                                    <div className="flex items-center space-x-3">
                                      <div className="flex space-x-1">
                                        <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
                                        <div
                                          className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"
                                          style={{ animationDelay: "0.1s" }}
                                        ></div>
                                        <div
                                          className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"
                                          style={{ animationDelay: "0.2s" }}
                                        ></div>
                                      </div>
                                      <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
                                        🔄 Preparing transaction...
                                      </span>
                                    </div>
                                    <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-100 dark:border-gray-700">
                                      <div className="animate-pulse space-y-3">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                          <div className="space-y-2">
                                            <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-20"></div>
                                            <div className="h-6 bg-gray-300 dark:bg-gray-500 rounded w-32"></div>
                                          </div>
                                          <div className="space-y-2">
                                            <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-24"></div>
                                            <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-28"></div>
                                          </div>
                                        </div>
                                        <div className="pt-2 border-t border-gray-100 dark:border-gray-700">
                                          <div className="h-3 bg-gray-200 dark:bg-gray-600 rounded w-3/4"></div>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            )}

                            {/* Swap preparation loading */}
                            {isSwapPreparing && (
                              <div className="mt-4">
                                <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                                  <div className="bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 border border-purple-200 dark:border-purple-700 rounded-xl p-5 space-y-4">
                                    <div className="flex items-center space-x-3">
                                      <div className="flex space-x-1">
                                        <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce"></div>
                                        <div
                                          className="w-2 h-2 bg-purple-500 rounded-full animate-bounce"
                                          style={{ animationDelay: "0.1s" }}
                                        ></div>
                                        <div
                                          className="w-2 h-2 bg-purple-500 rounded-full animate-bounce"
                                          style={{ animationDelay: "0.2s" }}
                                        ></div>
                                      </div>
                                      <span className="text-sm font-medium text-purple-700 dark:text-purple-300">
                                        🔄 Preparing swap...
                                      </span>
                                    </div>
                                    <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-100 dark:border-gray-700">
                                      <div className="animate-pulse space-y-3">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                          <div className="space-y-2">
                                            <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-16"></div>
                                            <div className="h-6 bg-gray-300 dark:bg-gray-500 rounded w-24"></div>
                                          </div>
                                          <div className="space-y-2">
                                            <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-20"></div>
                                            <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-28"></div>
                                          </div>
                                        </div>
                                        <div className="pt-2 border-t border-gray-100 dark:border-gray-700">
                                          <div className="h-3 bg-gray-200 dark:bg-gray-600 rounded w-2/3"></div>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            )}

                            {/* Complete transaction UI card */}
                            {hasCompleteTransaction &&
                              (() => {
                                try {
                                  const transactionData = JSON.parse(
                                    transactionMatch[1]
                                  );
                                  return (
                                    <div className="mt-4">
                                      <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                                          💳 <strong>Transaction Ready</strong>{" "}
                                          - Review the details below and approve
                                          when ready
                                        </p>
                                      </div>
                                      <TransactionActions
                                        transactionIntent={transactionData}
                                        onTransactionComplete={
                                          handleTransactionComplete
                                        }
                                      />
                                    </div>
                                  );
                                } catch {
                                  return null;
                                }
                              })()}

                            {/* Complete swap UI card */}
                            {hasCompleteSwap &&
                              (() => {
                                try {
                                  const swapData = JSON.parse(swapMatch[1]);
                                  return (
                                    <div className="mt-4">
                                      <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                                          🔄 <strong>Swap Ready</strong> -
                                          Review the details below and execute
                                          when ready
                                        </p>
                                      </div>
                                      <SwapActions
                                        swapIntent={swapData}
                                        onSwapComplete={handleSwapComplete}
                                      />
                                    </div>
                                  );
                                } catch {
                                  return null;
                                }
                              })()}
                          </>
                        );
                      })()}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Loading Indicator */}
          {isLoading && (
            <div className="flex justify-start">
              <div className="max-w-3xl px-4 py-3 rounded-2xl bg-gray-100 dark:bg-gray-800">
                <div className="flex items-center space-x-2">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div
                      className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                      style={{ animationDelay: "0.1s" }}
                    ></div>
                    <div
                      className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                      style={{ animationDelay: "0.2s" }}
                    ></div>
                  </div>
                  <span className="text-sm text-gray-500">
                    SOLMate is thinking...
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Input at bottom */}
          <form onSubmit={handleFormSubmit} className="relative">
            <div className="relative bg-gray-50 dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 focus-within:border-gray-400 dark:focus-within:border-gray-500 transition-colors">
              <textarea
                value={input}
                onChange={handleInputChange}
                placeholder="Continue the conversation..."
                className="w-full px-4 py-4 pr-16 bg-transparent resize-none border-none outline-none text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                rows={1}
                style={{ minHeight: "60px" }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleFormSubmit(e as React.FormEvent);
                  }
                }}
              />
              <div className="absolute bottom-3 right-3">
                <button
                  type="submit"
                  disabled={!input.trim() || isLoading}
                  className="p-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-lg hover:bg-gray-700 dark:hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ArrowUpIcon size={20} />
                </button>
              </div>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default ChatInterface;
