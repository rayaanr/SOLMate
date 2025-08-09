"use client";

import { useState, useCallback } from "react";

interface Message {
  role: "user" | "assistant";
  content: string;
  transactionIntent?: any;
}

interface UseChatOptions {
  api: string;
  onError?: (error: Error) => void;
}

export function useChat({ api, onError }: UseChatOptions) {
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setInput(e.target.value);
    },
    []
  );

  const sendMessage = useCallback(
    async (message: string, userWallet?: string) => {
      if (!message.trim() || isLoading) return;

      const userMessage: Message = { role: "user", content: message.trim() };
      setMessages((prev) => [...prev, userMessage]);
      setIsLoading(true);

      try {
        const response = await fetch(api, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            prompt: message.trim(),
            userWallet,
          }),
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const contentType = response.headers.get("content-type");

        // Check if it's a transaction preparation response
        if (contentType?.includes("application/json")) {
          const data = await response.json();

          if (data.type === "transaction_prepared") {
            // Handle transaction intent
            const assistantMessage: Message = {
              role: "assistant",
              content: `I've prepared your transaction: ${data.intent.description}`,
              transactionIntent: data.intent,
            };
            setMessages((prev) => [...prev, assistantMessage]);
            return;
          }
        }

        // Handle streaming text response
        if (!response.body) {
          throw new Error("No response body");
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();

        let assistantMessage: Message = { role: "assistant", content: "" };
        setMessages((prev) => [...prev, assistantMessage]);

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split("\n");

          for (const line of lines) {
            if (line.startsWith("data: ")) {
              const data = line.slice(6);
              if (data === "[DONE]") continue;

              try {
                const parsed = JSON.parse(data);
                if (parsed.choices?.[0]?.delta?.content) {
                  assistantMessage.content += parsed.choices[0].delta.content;
                  setMessages((prev) => {
                    const newMessages = [...prev];
                    newMessages[newMessages.length - 1] = {
                      ...assistantMessage,
                    };
                    return newMessages;
                  });
                }
              } catch (e) {
                // Handle plain text chunks
                assistantMessage.content += data;
                setMessages((prev) => {
                  const newMessages = [...prev];
                  newMessages[newMessages.length - 1] = { ...assistantMessage };
                  return newMessages;
                });
              }
            }
          }
        }
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "An error occurred";
        onError?.(error instanceof Error ? error : new Error(errorMessage));

        // Add error message
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: `I apologize, but I encountered an error: ${errorMessage}. Please try again.`,
          },
        ]);
      } finally {
        setIsLoading(false);
      }
    },
    [api, onError, isLoading]
  );

  return {
    input,
    setInput,
    handleInputChange,
    isLoading,
    messages,
    sendMessage,
  };
}
