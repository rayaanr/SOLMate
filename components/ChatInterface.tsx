"use client";

import React from "react";
import { ArrowUpIcon } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { useChat } from "@/lib/useChat";
import { TransactionActions } from "./TransactionActions";
import { useSolanaWallet } from "@web3auth/modal/react/solana";

const ChatInterface = () => {
  // Get Web3Auth wallet
  const { accounts } = useSolanaWallet();
  const userWallet = accounts && accounts.length > 0 ? accounts[0] : undefined;

  // Set userWallet globally whenever it changes
  React.useEffect(() => {
    (window as any).userWallet = userWallet;
  }, [userWallet]);

  const {
    messages,
    input,
    handleInputChange,
    handleSubmit,
    isLoading,
  } = useChat({
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
                placeholder="Ask SOL Sensei about Solana development, or say 'Send 5 USDC to alice.sol'..."
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
              Ask me anything about Solana development, check wallet balances, or send transactions like "Send 5 USDC to alice.sol"
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
                        // Check if this message contains transaction data
                        const transactionMatch = message.content.match(/\[TRANSACTION_DATA\](.*?)\[\/TRANSACTION_DATA\]/);
                        const hasTransaction = transactionMatch !== null;
                        
                        // Clean content without transaction data
                        const cleanContent = message.content.replace(/\[TRANSACTION_DATA\].*?\[\/TRANSACTION_DATA\]/g, '').trim();
                        
                        return (
                          <>
                            {/* Main response content */}
                            <div className="prose dark:prose-invert max-w-none">
                              <ReactMarkdown>
                                {cleanContent}
                              </ReactMarkdown>
                            </div>

                            {/* Transaction UI card if transaction data exists */}
                            {hasTransaction && (() => {
                              try {
                                const transactionData = JSON.parse(transactionMatch[1]);
                                return (
                                  <div className="mt-4">
                                    <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                                        💳 <strong>Transaction Ready</strong> - Review the details below and approve when ready
                                      </p>
                                    </div>
                                    <TransactionActions
                                      intent={transactionData}
                                      onTransactionComplete={handleTransactionComplete}
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
                    SOL Sensei is thinking...
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
