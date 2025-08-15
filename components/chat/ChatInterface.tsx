"use client";

import React from "react";
import { useChat } from "@/hooks/useChat";
import { useUserWallet } from "@/contexts/UserWalletContext";
import { WelcomeScreen } from "./WelcomeScreen";
import { ChatMessage } from "./ChatMessage";
import { ChatLoadingIndicator } from "./ChatLoadingIndicator";
import { ChatInput } from "./ChatInput";

const ChatInterface = () => {
  // Get wallet from context
  const { userWallet } = useUserWallet();

  const { messages, input, handleInputChange, handleSubmit, isLoading } =
    useChat({
      api: "/api/chat",
      userWallet,
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
            {messages.map((message) => (
              <ChatMessage
                key={message.id}
                message={message}
                onTransactionComplete={handleTransactionComplete}
                onSwapComplete={handleSwapComplete}
              />
            ))}
          </div>

          {/* Smart loading: show only until streaming begins */}
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
