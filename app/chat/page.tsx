"use client";

import ConversationPromptInput from "@/components/primitives/chatbot";
import { useChatContext } from "@/contexts/ChatContext";

export default function ChatPage() {
  const { chatKey } = useChatContext();

  return (
    <div className="h-screen flex flex-col">
      <main className="flex-1 min-h-0 pt-14">
        <ConversationPromptInput key={chatKey} />
      </main>
    </div>
  );
}
