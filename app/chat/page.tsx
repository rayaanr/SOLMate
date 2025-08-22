"use client";

import ConversationPromptInput from "@/components/primitives/chatbot";
import { useSearchParams } from "next/navigation";
import { useRef } from "react";
import { generateChatId } from "@/lib/chat";

export default function ChatPage() {
  const searchParams = useSearchParams();
  const initialIdRef = useRef<string>(
    searchParams.get("id") || generateChatId()
  );
  const chatId = initialIdRef.current;

  return (
    <div className="h-screen">
      <ConversationPromptInput key={chatId} />
    </div>
  );
}
