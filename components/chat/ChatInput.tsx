import React from "react";
import { ArrowUpIcon } from "lucide-react";

interface ChatInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  placeholder?: string;
  disabled?: boolean;
  isLoading?: boolean;
}

export function ChatInput({
  value,
  onChange,
  onSubmit,
  placeholder = "Continue the conversation...",
  disabled = false,
  isLoading = false,
}: ChatInputProps) {
  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!value.trim() || disabled || isLoading) return;
    onSubmit(e);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange(e.target.value);
  };

  return (
    <form onSubmit={handleFormSubmit} className="relative">
      <div className="relative bg-gray-50 dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 focus-within:border-gray-400 dark:focus-within:border-gray-500 transition-colors">
        <textarea
          value={value}
          onChange={handleInputChange}
          placeholder={placeholder}
          className="w-full px-4 py-4 pr-16 bg-transparent resize-none border-none outline-none text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
          rows={1}
          style={{ minHeight: "60px" }}
          disabled={disabled}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleFormSubmit(e as React.FormEvent);
            }
          }}
        />
        <div className="absolute bottom-3 right-3">
          <button
            type="submit"
            disabled={!value.trim() || disabled || isLoading}
            className="p-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-lg hover:bg-gray-700 dark:hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <ArrowUpIcon size={20} />
          </button>
        </div>
      </div>
    </form>
  );
}
