"use client";

import { useState } from "react";
import { PaperclipIcon, ArrowUpIcon } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { useChat } from "@/lib/useChat";
import { TransactionActions } from "./TransactionActions";
import { useSolanaWallet } from "@web3auth/modal/react/solana";

interface TransactionIntent {
  intentId: string;
  txBase64: string;
  preview: {
    type: string;
    from: string;
    to: string;
    amount: number;
    symbol: string;
    description: string;
  };
  feeLamports: number;
  expiresAt: number;
}

const ChatInterface = () => {
  const {
    input,
    handleInputChange,
    sendMessage,
    setInput,
    isLoading,
    messages,
  } = useChat({
    api: "/api/chat",
    onError: (error) => {
      console.error("Chat error:", error);
    },
  });

  const [selectedMode, setSelectedMode] = useState("summary");
  
  // Get Web3Auth wallet
  const { accounts } = useSolanaWallet();
  const userWallet = accounts && accounts.length > 0 ? accounts[0] : undefined;

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    // Add mode context to the prompt
    let enhancedPrompt = input.trim();
    if (selectedMode !== "summary") {
      const modePrompts = {
        code: "Please provide a code-focused response with examples and implementation details: ",
        design:
          "Please provide a design-focused response with UI/UX considerations and visual elements: ",
        research:
          "Please provide a research-focused response with detailed analysis and references: ",
        inspire:
          "Please provide an inspiring and creative response with innovative ideas: ",
      };
      enhancedPrompt =
        modePrompts[selectedMode as keyof typeof modePrompts] + enhancedPrompt;
    }

    // Send message with user wallet if available
    sendMessage(enhancedPrompt, userWallet);
    setInput("");
  };

  const handleTransactionComplete = (signature: string) => {
    console.log("Transaction completed:", signature);
    // You could add a success message to the chat here
  };

  const modes = [
    { id: "summary", label: "Summary", icon: "📋" },
    { id: "code", label: "Code", icon: "💻" },
    { id: "design", label: "Design", icon: "🎨" },
    { id: "research", label: "Research", icon: "📚" },
    { id: "inspire", label: "Get Inspired", icon: "✨" },
  ];

  const thinkingModes = [
    { id: "deep", label: "Think Deeply", icon: "🧠" },
    { id: "gentle", label: "Learn Gently", icon: "🌱" },
  ];

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
              <div className="absolute bottom-3 right-3 flex items-center gap-2">
                <button
                  type="button"
                  className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
                >
                  <PaperclipIcon size={20} />
                </button>
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

          {/* Mode Selection */}
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium mb-3 text-gray-700 dark:text-gray-300">
                Choose your approach
              </h3>
              <div className="flex flex-wrap justify-center gap-3">
                {modes.map((mode) => (
                  <button
                    key={mode.id}
                    onClick={() => setSelectedMode(mode.id)}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                      selectedMode === mode.id
                        ? "bg-gray-900 dark:bg-white text-white dark:text-gray-900"
                        : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
                    }`}
                  >
                    {mode.icon} {mode.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-lg font-medium mb-3 text-gray-700 dark:text-gray-300">
                Thinking modes
              </h3>
              <div className="flex flex-wrap justify-center gap-3">
                {thinkingModes.map((mode) => (
                  <button
                    key={mode.id}
                    onClick={() => setSelectedMode(mode.id)}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                      selectedMode === mode.id
                        ? "bg-gray-900 dark:bg-white text-white dark:text-gray-900"
                        : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
                    }`}
                  >
                    {mode.icon} {mode.label}
                  </button>
                ))}
              </div>
            </div>
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
                      <div className="prose dark:prose-invert max-w-none">
                        <ReactMarkdown>{message.content}</ReactMarkdown>
                      </div>

                      {/* Render transaction actions if present */}
                      {message.transactionIntent && (
                        <TransactionActions
                          intent={message.transactionIntent}
                          onTransactionComplete={handleTransactionComplete}
                        />
                      )}
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
              <div className="absolute bottom-3 right-3 flex items-center gap-2">
                <button
                  type="button"
                  className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
                >
                  <PaperclipIcon size={20} />
                </button>
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
