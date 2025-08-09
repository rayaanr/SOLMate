"use client";

import { useState } from "react";
import { PaperclipIcon, ArrowUpIcon } from "lucide-react";
import { useCompletion } from "@ai-sdk/react";
import ReactMarkdown from "react-markdown";

const ChatInterface = () => {
  const {
    input,
    handleInputChange,
    complete,
    setInput,
    isLoading,
    completion,
  } = useCompletion({
    api: "/api/chat",
    onError: (error) => {
      console.error("Completion error:", error);
    },
  });
  const [selectedMode, setSelectedMode] = useState("summary");
  const [conversationHistory, setConversationHistory] = useState<
    Array<{ role: "user" | "assistant"; content: string }>
  >([]);

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    // Add mode context to the prompt
    let enhancedPrompt = input.trim();
    if (selectedMode !== "summary") {
      const modePrompts = {
        code: "Please provide a code-focused response with examples and implementation details: ",
        design:
          "Please provide a design-focused response with UI/UX considerations and visual elements: ",
        research:
          "Please provide a research-focused response with detailed analysis and references: ",
        inspire:
          "Please provide an inspiring and creative response with innovative ideas: ",
      };
      enhancedPrompt =
        modePrompts[selectedMode as keyof typeof modePrompts] + enhancedPrompt;
    }

    // Add user message to history
    const userMessage = { role: "user" as const, content: input.trim() };
    setConversationHistory((prev) => [...prev, userMessage]);

    // fire the streaming completion and clear local input
    setInput("");
    complete(enhancedPrompt);
  };

  const modes = [
    { id: "summary", label: "Summary", icon: "📋" },
    { id: "code", label: "Code", icon: "💻" },
    { id: "design", label: "Design", icon: "🎨" },
    { id: "research", label: "Research", icon: "📚" },
    { id: "inspire", label: "Get Inspired", icon: "✨" },
  ];

  const thinkingModes = [
    { id: "deep", label: "Think Deeply", icon: "🧠" },
    { id: "gentle", label: "Learn Gently", icon: "🌱" },
  ];

  return (
    <div className="w-full max-w-4xl mx-auto">
      {conversationHistory.length === 0 ? (
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-6xl font-normal mb-8 text-gray-900 dark:text-white">
            What's on your mind?
          </h1>

          {/* Chat Input */}
          <form onSubmit={handleFormSubmit} className="relative mb-8">
            <div className="relative bg-gray-50 dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 focus-within:border-gray-400 dark:focus-within:border-gray-500 transition-colors">
              <textarea
                value={input}
                onChange={handleInputChange}
                placeholder="Ask SOL Sensei about Solana development..."
                className="w-full px-4 py-4 pr-16 bg-transparent resize-none border-none outline-none text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                rows={1}
                style={{ minHeight: "60px" }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleFormSubmit(e as any);
                  }
                }}
              />
              <div className="absolute bottom-3 right-3 flex items-center gap-2">
                <button
                  type="button"
                  className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
                >
                  <PaperclipIcon size={20} />
                </button>
                <button
                  type="submit"
                  disabled={isLoading || !input.trim()}
                  className="p-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-full hover:bg-gray-700 dark:hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ArrowUpIcon size={16} />
                </button>
              </div>
            </div>
          </form>

          {/* Live streaming preview for first message */}
          {isLoading && completion && (
            <div className="flex justify-center mb-6">
              <div className="max-w-3xl px-4 py-3 rounded-2xl bg-gray-100 text-gray-900 dark:bg-gray-800 dark:text-white text-left">
                <div className="prose prose-gray dark:prose-invert max-w-none">
                  <ReactMarkdown 
                    components={{
                      p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                      ul: ({ children }) => <ul className="mb-2 pl-4 list-disc">{children}</ul>,
                      ol: ({ children }) => <ol className="mb-2 pl-4 list-decimal">{children}</ol>,
                      li: ({ children }) => <li className="mb-1">{children}</li>,
                      code: ({ children, className }) => 
                        className ? 
                          <code className="block bg-gray-200 dark:bg-gray-700 p-2 rounded text-sm overflow-x-auto">{children}</code> : 
                          <code className="bg-gray-200 dark:bg-gray-700 px-1 py-0.5 rounded text-sm">{children}</code>,
                      strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
                      em: ({ children }) => <em className="italic">{children}</em>
                    }}
                  >
                    {completion}
                  </ReactMarkdown>
                </div>
              </div>
            </div>
          )}

          {/* Show completion even when not loading (for first message) */}
          {completion && !isLoading && conversationHistory.length === 0 && (
            <div className="flex justify-center mb-6">
              <div className="max-w-3xl px-4 py-3 rounded-2xl bg-gray-100 text-gray-900 dark:bg-gray-800 dark:text-white text-left">
                <div className="prose prose-gray dark:prose-invert max-w-none">
                  <ReactMarkdown 
                    components={{
                      p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                      ul: ({ children }) => <ul className="mb-2 pl-4 list-disc">{children}</ul>,
                      ol: ({ children }) => <ol className="mb-2 pl-4 list-decimal">{children}</ol>,
                      li: ({ children }) => <li className="mb-1">{children}</li>,
                      code: ({ children, className }) => 
                        className ? 
                          <code className="block bg-gray-200 dark:bg-gray-700 p-2 rounded text-sm overflow-x-auto">{children}</code> : 
                          <code className="bg-gray-200 dark:bg-gray-700 px-1 py-0.5 rounded text-sm">{children}</code>,
                      strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
                      em: ({ children }) => <em className="italic">{children}</em>
                    }}
                  >
                    {completion}
                  </ReactMarkdown>
                </div>
              </div>
            </div>
          )}

          {/* Mode Buttons */}
          <div className="flex flex-wrap justify-center gap-3 mb-6">
            {modes.map((mode) => (
              <button
                key={mode.id}
                onClick={() => {
                  setSelectedMode(mode.id);
                  // Add mode context to the next message
                  const modePrompt = `Please respond in ${mode.label} mode. `;
                  if (input.trim() && !input.startsWith(modePrompt)) {
                    // This will be handled by the form submission
                  }
                }}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors border ${
                  selectedMode === mode.id
                    ? "bg-gray-900 text-white dark:bg-white dark:text-gray-900 border-gray-900 dark:border-white"
                    : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700"
                }`}
              >
                <span className="mr-2">{mode.icon}</span>
                {mode.label}
              </button>
            ))}
          </div>

          {/* Thinking Mode Buttons */}
          <div className="flex justify-center gap-3">
            {thinkingModes.map((mode) => (
              <button
                key={mode.id}
                className="px-4 py-2 rounded-full text-sm font-medium bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700 transition-colors"
              >
                <span className="mr-2">{mode.icon}</span>
                {mode.label}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="mb-6">
          {/* Messages Display */}
          <div className="space-y-6 mb-6">
            {conversationHistory.map((message, index) => (
              <div
                key={index}
                className={`flex ${
                  message.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`max-w-3xl px-4 py-3 rounded-2xl ${
                    message.role === "user"
                      ? "bg-gray-900 text-white dark:bg-white dark:text-gray-900"
                      : "bg-gray-100 text-gray-900 dark:bg-gray-800 dark:text-white"
                  }`}
                >
                  {message.role === "assistant" ? (
                    <div className="prose prose-gray dark:prose-invert max-w-none">
                      <ReactMarkdown 
                        components={{
                          p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                          ul: ({ children }) => <ul className="mb-2 pl-4 list-disc">{children}</ul>,
                          ol: ({ children }) => <ol className="mb-2 pl-4 list-decimal">{children}</ol>,
                          li: ({ children }) => <li className="mb-1">{children}</li>,
                          code: ({ children, className }) => 
                            className ? 
                              <code className="block bg-gray-200 dark:bg-gray-700 p-2 rounded text-sm overflow-x-auto">{children}</code> : 
                              <code className="bg-gray-200 dark:bg-gray-700 px-1 py-0.5 rounded text-sm">{children}</code>,
                          strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
                          em: ({ children }) => <em className="italic">{children}</em>
                        }}
                      >
                        {message.content}
                      </ReactMarkdown>
                    </div>
                  ) : (
                    <div className="whitespace-pre-wrap">{message.content}</div>
                  )}
                </div>
              </div>
            ))}

            {/* Show streaming completion bubble (live text) */}
            {completion && (
              <div className="flex justify-start">
                <div className="max-w-3xl px-4 py-3 rounded-2xl bg-gray-100 text-gray-900 dark:bg-gray-800 dark:text-white">
                  <div className="prose prose-gray dark:prose-invert max-w-none">
                    <ReactMarkdown 
                      components={{
                        p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                        ul: ({ children }) => <ul className="mb-2 pl-4 list-disc">{children}</ul>,
                        ol: ({ children }) => <ol className="mb-2 pl-4 list-decimal">{children}</ol>,
                        li: ({ children }) => <li className="mb-1">{children}</li>,
                        code: ({ children, className }) => 
                          className ? 
                            <code className="block bg-gray-200 dark:bg-gray-700 p-2 rounded text-sm overflow-x-auto">{children}</code> : 
                            <code className="bg-gray-200 dark:bg-gray-700 px-1 py-0.5 rounded text-sm">{children}</code>,
                        strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
                        em: ({ children }) => <em className="italic">{children}</em>
                      }}
                    >
                      {completion}
                    </ReactMarkdown>
                  </div>
                </div>
              </div>
            )}

            {isLoading && !completion && (
              <div className="flex justify-start">
                <div className="max-w-3xl px-4 py-3 rounded-2xl bg-gray-100 text-gray-900 dark:bg-gray-800 dark:text-white">
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900 dark:border-white"></div>
                    <span>SOL Sensei is thinking...</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Input for continuing conversation */}
          <form onSubmit={handleFormSubmit} className="relative">
            <div className="relative bg-gray-50 dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 focus-within:border-gray-400 dark:focus-within:border-gray-500 transition-colors">
              <textarea
                value={input}
                onChange={handleInputChange}
                placeholder="Continue the conversation..."
                className="w-full px-4 py-4 pr-16 bg-transparent resize-none border-none outline-none text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                rows={1}
                style={{ minHeight: "60px" }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleFormSubmit(e as any);
                  }
                }}
              />
              <div className="absolute bottom-3 right-3 flex items-center gap-2">
                <button
                  type="button"
                  className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
                >
                  <PaperclipIcon size={20} />
                </button>
                <button
                  type="submit"
                  disabled={isLoading || !input.trim()}
                  className="p-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-full hover:bg-gray-700 dark:hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ArrowUpIcon size={16} />
                </button>
              </div>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default ChatInterface;
