"use client";

import { TopNav } from "./TopNav";
import { useChatContext } from "@/contexts/ChatContext";
import { usePathname } from "next/navigation";

export function TopNavWrapper() {
  const { resetChat } = useChatContext();
  const pathname = usePathname();

  const handleNewChat = pathname === "/chat" ? resetChat : undefined;

  return <TopNav onNewChat={handleNewChat} />;
}
