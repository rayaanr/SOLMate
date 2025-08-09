"use client";

import { useCompletion } from "@ai-sdk/react";
import { useState } from "react";

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

export function useChat({ api, onError }: { api: string; onError?: (error: Error) => void }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentUserMessage, setCurrentUserMessage] = useState<string>("");
  
  const {
    completion,
    input,
    handleInputChange,
    handleSubmit: originalHandleSubmit,
    isLoading,
    setInput,
  } = useCompletion({
    api,
    body: {
      userWallet: typeof window !== 'undefined' ? (window as any).userWallet : undefined,
    },
    onFinish: (prompt, completion) => {
      // When completion finishes, add both messages to history and clear current
      const userMsg: Message = {
        id: Date.now().toString(),
        role: "user", 
        content: prompt,
      };
      const assistantMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: completion,
      };
      setMessages(prev => [...prev, userMsg, assistantMsg]);
      setCurrentUserMessage("");
    },
    onError: (error) => {
      setCurrentUserMessage("");
      onError?.(error);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    
    // Store the current input as the user message being processed
    setCurrentUserMessage(input);
    
    originalHandleSubmit(e);
  };

  // Build display messages: history + current conversation if active
  const displayMessages: Message[] = [
    ...messages,
    // Add current user message if we're in the middle of a completion
    ...(currentUserMessage ? [{
      id: "current-user",
      role: "user" as const,
      content: currentUserMessage,
    }] : []),
    // Add streaming completion if active
    ...(completion ? [{
      id: "current-completion",
      role: "assistant" as const,
      content: completion,
    }] : []),
  ];

  return {
    messages: displayMessages,
    input,
    handleInputChange,
    handleSubmit,
    isLoading,
    setInput,
  };
}
