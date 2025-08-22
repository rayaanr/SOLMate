"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  ReactNode,
} from "react";

interface ChatContextType {
  chatKey: number;
  resetChat: () => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const useChatContext = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error("useChatContext must be used within a ChatProvider");
  }
  return context;
};

interface ChatProviderProps {
  children: ReactNode;
}

export const ChatProvider = ({ children }: ChatProviderProps) => {
  const [chatKey, setChatKey] = useState(0);

  const resetChat = useCallback(() => {
    setChatKey((prev) => prev + 1);
  }, []);

  return (
    <ChatContext.Provider value={{ chatKey, resetChat }}>
      {children}
    </ChatContext.Provider>
  );
};
