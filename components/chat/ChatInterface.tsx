"use client";

import React from "react";
import { useChat } from "@/hooks/useChat";
import { useSolanaWallet } from "@web3auth/modal/react/solana";
import { WelcomeScreen } from "./WelcomeScreen";
import { ChatMessage } from "./ChatMessage";
import { ChatLoadingIndicator } from "./ChatLoadingIndicator";
import { ChatInput } from "./ChatInput";

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

  const handleInputChangeAdapter = (value: string) => {
    handleInputChange({ target: { value } } as React.ChangeEvent<HTMLInputElement>);
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      {messages.length === 0 ? (
        <WelcomeScreen
          input={input}
          onInputChange={handleInputChangeAdapter}
          onSubmit={handleFormSubmit}
          isLoading={isLoading}
        />
      ) : (
        <div className="space-y-6">
          {/* Conversation History */}
          <div className="space-y-6">
            {messages.map((message, index) => (
              <ChatMessage
                key={index}
                message={message}
                index={index}
                onTransactionComplete={handleTransactionComplete}
                onSwapComplete={handleSwapComplete}
              />
            ))}
          </div>

          {/* Loading Indicator */}
          {isLoading && <ChatLoadingIndicator />}

          {/* Input at bottom */}
          <ChatInput
            value={input}
            onChange={handleInputChangeAdapter}
            onSubmit={handleFormSubmit}
            isLoading={isLoading}
          />
        </div>
      )}
    </div>
  );
};

export default ChatInterface;
