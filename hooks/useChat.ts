"use client";

import { useCompletion } from "@ai-sdk/react";
import { useState, useEffect } from "react";

export type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

const HISTORY_LIMIT = 10;

export function useChat({
  api,
  onError,
  userWallet,
  chatId,
}: {
  api: string;
  onError?: (error: Error) => void;
  userWallet?: string;
  chatId?: string;
}) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentUserInput, setCurrentUserInput] = useState<string>("");
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
      userWallet,
      // Include chat history in the request
      chatHistory: messages.slice(-HISTORY_LIMIT),
    },
    onFinish: (prompt, completion) => {
      // Add both messages to permanent history
      const userMsg: Message = {
        id: `user-${Date.now()}`,
        role: "user",
        content: prompt,
      };
      const assistantMsg: Message = {
        id: `assistant-${Date.now()}`,
        role: "assistant",
        content: completion,
      };

      setMessages((prev) => {
        // Check if messages already exist to prevent duplicates
        const hasUserMessage = prev.some(
          (msg) => msg.role === "user" && msg.content === prompt
        );
        const hasAssistantMessage = prev.some(
          (msg) => msg.role === "assistant" && msg.content === completion
        );

        if (hasUserMessage && hasAssistantMessage) {
          return prev; // Both already exist
        }

        const newMessages = [...prev];
        if (!hasUserMessage) {
          newMessages.push(userMsg);
        }
        if (!hasAssistantMessage) {
          newMessages.push(assistantMsg);
        }

        // Save to localStorage for persistence
        const storageKey = `chat-history-${chatId || "default"}`;
        localStorage.setItem(storageKey, JSON.stringify(newMessages));

        return newMessages;
      });

      // Clear current state so streaming message disappears
      setCurrentUserInput("");
      setIsSubmitting(false);
    },
    onError: (error) => {
      setCurrentUserInput("");
      setIsSubmitting(false);
      onError?.(error);
    },
  });

  // Load chat history from localStorage when chatId changes
  useEffect(() => {
    const storageKey = `chat-history-${chatId || "default"}`;
    const savedMessages = localStorage.getItem(storageKey);

    if (savedMessages) {
      try {
        const parsedMessages = JSON.parse(savedMessages);
        setMessages(parsedMessages);
      } catch (error) {
        console.error("Failed to parse saved messages:", error);
        setMessages([]);
      }
    } else {
      setMessages([]);
    }

    setCurrentUserInput("");
    setIsSubmitting(false);
    setInput("");
  }, [chatId, setInput]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading || isSubmitting) return;

    // Prevent duplicate submissions
    setIsSubmitting(true);

    // Store the current input
    const messageText = input.trim();
    setCurrentUserInput(messageText);

    // Clear the input field immediately
    setInput("");

    try {
      // Use the complete function directly with the saved message
      await complete(messageText);
    } catch (error) {
      console.error("Completion error:", error);
      setCurrentUserInput("");
      setIsSubmitting(false);
      onError?.(error as Error);
    }
  };

  // Build display messages: permanent messages + current conversation if active
  const displayMessages: Message[] = [
    ...messages,
    // Add current user message if we're processing
    ...(currentUserInput
      ? [
          {
            id: "current-user",
            role: "user" as const,
            content: currentUserInput,
          },
        ]
      : []),
    // Add streaming completion if active AND not already in permanent messages
    ...(completion &&
    !messages.some(
      (msg) => msg.role === "assistant" && msg.content === completion
    )
      ? [
          {
            id: "current-assistant",
            role: "assistant" as const,
            content: completion,
          },
        ]
      : []),
  ];

  // Smart loading state: show loading only when waiting for stream to start
  // Hide loading once streaming has begun (completion has content)
  const showLoading = isLoading && !completion;

  // Function to clear chat history
  const clearHistory = () => {
    const storageKey = `chat-history-${chatId || "default"}`;
    localStorage.removeItem(storageKey);
    setMessages([]);
    setCurrentUserInput("");
    setInput("");
  };

  return {
    messages: displayMessages,
    input,
    handleInputChange,
    handleSubmit,
    isLoading: showLoading,
    setInput,
    clearHistory,
  };
}
