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
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const {
    completion,
    input,
    handleInputChange,
    complete,
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
      setMessages(prev => {
        // Prevent duplicates by checking if the message already exists
        const lastMessage = prev[prev.length - 1];
        if (lastMessage && lastMessage.content === completion && lastMessage.role === "assistant") {
          return prev;
        }
        return [...prev, userMsg, assistantMsg];
      });
      setCurrentUserMessage("");
      setIsSubmitting(false);
    },
    onError: (error) => {
      setCurrentUserMessage("");
      setIsSubmitting(false);
      onError?.(error);
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading || isSubmitting) return;
    
    // Prevent duplicate submissions
    setIsSubmitting(true);
    
    // Store the current input as the user message being processed
    const messageText = input.trim();
    setCurrentUserMessage(messageText);
    
    // Clear the input field immediately
    setInput("");
    
    try {
      // Use the complete function directly with the saved message
      await complete(messageText);
    } catch (error) {
      console.error('Completion error:', error);
      setCurrentUserMessage("");
      setIsSubmitting(false);
      onError?.(error as Error);
    }
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

  // Smart loading state: show loading only when waiting for stream to start
  // Hide loading once streaming has begun (completion has content)
  const showLoading = isLoading && !completion;

  return {
    messages: displayMessages,
    input,
    handleInputChange,
    handleSubmit,
    isLoading: showLoading,
    setInput,
  };
}
