import React from "react";
import { ChatInput } from "./ChatInput";

interface WelcomeScreenProps {
  input: string;
  onInputChange: (value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  isLoading: boolean;
}

export function WelcomeScreen({
  input,
  onInputChange,
  onSubmit,
  isLoading,
}: WelcomeScreenProps) {
  return (
    <div className="text-center mb-12">
      <h1 className="text-4xl md:text-6xl font-normal mb-8 text-gray-900 dark:text-white">
        What's on your mind?
      </h1>

      {/* Chat Input */}
      <div className="mb-8">
        <ChatInput
          value={input}
          onChange={onInputChange}
          onSubmit={onSubmit}
          placeholder="Ask SOLMate about Solana development, or say 'Send 5 USDC to alice.sol'..."
          isLoading={isLoading}
        />
      </div>

      {/* Simple intro text */}
      <div className="text-center">
        <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
          Ask me anything about Solana development, check wallet balances,
          or send transactions like "Send 5 USDC to alice.sol"
        </p>
      </div>
    </div>
  );
}
