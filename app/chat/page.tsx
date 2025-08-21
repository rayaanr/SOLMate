"use client";

import ConversationPromptInput from "@/components/NewComp/primitives/chatbot";
import { TopNav } from "@/components/NewComp/top-nav";
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
