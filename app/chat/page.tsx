"use client";

import ConversationPromptInput from "@/components/primitives/chatbot";
import { useSearchParams } from "next/navigation";

export default function ChatPage() {
  const searchParams = useSearchParams();
  const chatId = searchParams.get("id") || crypto.randomUUID();

  return (
    <div className="h-screen">
      <ConversationPromptInput key={chatId} />
    </div>
  );
}
