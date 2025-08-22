"use client";

import ConversationPromptInput from "@/components/primitives/chatbot";
import { TopNav } from "@/components/TopNav";
import { useState } from "react";

export default function Home() {
  const [chatKey, setChatKey] = useState(0);

  const handleNewChat = () => {
    setChatKey((prev) => prev + 1);
  };

  return (
    <div className="h-screen flex flex-col">
      <TopNav onNewChat={handleNewChat} />
      <main className="flex-1 min-h-0">
        <ConversationPromptInput key={chatKey} />
      </main>
    </div>
  );
}
