"use client";

import ConversationPromptInput from "@/components/primitives/chatbot";
import { useSearchParams } from "next/navigation";
import { generateChatId } from "@/lib/chat";
import { motion, AnimatePresence } from "motion/react";

export default function ChatPage() {
  const searchParams = useSearchParams();
import { useSearchParams } from "next/navigation";
import { useMemo } from "react";

const idFromQuery = searchParams.get("id");
const chatId = useMemo(() => idFromQuery ?? generateChatId(), [idFromQuery]);

  return (
    <div className="h-[calc(100vh-4rem)] pt-4">
      <AnimatePresence mode="wait">
        <motion.div
          key={chatId}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{
            duration: 0.3,
            ease: "easeInOut",
          }}
          className="h-full"
        >
          <ConversationPromptInput chatId={chatId} />
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
