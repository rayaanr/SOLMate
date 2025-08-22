"use client";

import ConversationPromptInput from "@/components/primitives/chatbot";
import { useSearchParams } from "next/navigation";
import { useRef } from "react";

export default function ChatPage() {
  const searchParams = useSearchParams();
  const initialIdRef = useRef<string>(searchParams.get("id") || crypto.randomUUID());
  const chatId = initialIdRef.current;

  return (
    <div className="h-screen">
      <ConversationPromptInput key={chatId} />
    </div>
  );
}
