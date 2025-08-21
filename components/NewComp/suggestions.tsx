"use client";

import { PromptSuggestion } from "@/components/NewComp/prompt-kit/prompt-suggestion";
import { MotionWrapper } from "@/components/NewComp/motion-wrapper";
import { SUGGESTIONS } from "@/lib/rec";
import { TRANSITION_SUGGESTIONS } from "@/lib/motion";
import { AnimatePresence, motion } from "motion/react";
import React, { memo, useCallback, useEffect, useMemo, useState } from "react";

type SuggestionsProps = {
  onValueChange: (value: string) => void;
  onSuggestion: (suggestion: string) => void;
  value?: string;
};

const MotionPromptSuggestion = motion.create(PromptSuggestion);

export const Suggestions = memo(function Suggestions({
  onValueChange,
  onSuggestion,
  value,
}: SuggestionsProps) {
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  useEffect(() => {
    if (!value) {
      setActiveCategory(null);
    }
  }, [value]);

  const activeCategoryData = SUGGESTIONS.find(
    (group) => group.label === activeCategory
  );

  const showCategorySuggestions =
    activeCategoryData && activeCategoryData.items.length > 0;

  const handleSuggestionClick = useCallback(
    (suggestion: string) => {
      setActiveCategory(null);
      onSuggestion(suggestion);
      onValueChange("");
    },
    [onSuggestion, onValueChange]
  );

  const handleCategoryClick = useCallback(
    (suggestion: { label: string; prompt: string }) => {
      setActiveCategory(suggestion.label);
      onValueChange(suggestion.prompt);
    },
    [onValueChange]
  );

  const suggestionsGrid = useMemo(
    () => (
      <MotionWrapper
        key="suggestions-grid"
        className="flex w-full max-w-full flex-nowrap justify-start gap-2 overflow-x-auto px-2 md:mx-auto md:max-w-2xl md:flex-wrap md:justify-center md:pl-0"
        initial="initial"
        animate="animate"
        variants={{
          initial: { opacity: 0, y: 10, filter: "blur(4px)" },
          animate: { opacity: 1, y: 0, filter: "blur(0px)" },
        }}
        transition={TRANSITION_SUGGESTIONS}
        style={{
          scrollbarWidth: "none",
        }}
      >
        {SUGGESTIONS.map((suggestion, index) => (
          <MotionPromptSuggestion
            key={suggestion.label}
            onClick={() => handleCategoryClick(suggestion)}
            className="capitalize [&>button]:!transition-none"
            initial="initial"
            animate="animate"
            transition={{
              ...TRANSITION_SUGGESTIONS,
              delay: index * 0.02,
            }}
            variants={{
              initial: { opacity: 0, scale: 0.8 },
              animate: { opacity: 1, scale: 1 },
            }}
          >
            <suggestion.icon className="size-4" />
            {suggestion.label}
          </MotionPromptSuggestion>
        ))}
      </MotionWrapper>
    ),
    [handleCategoryClick]
  );

  const suggestionsList = useMemo(
    () => (
      <MotionWrapper
        className="flex w-full flex-col space-y-1 px-2"
        key={activeCategoryData?.label}
        initial="initial"
        animate="animate"
        variants={{
          initial: { opacity: 0, y: 10, filter: "blur(4px)" },
          animate: { opacity: 1, y: 0, filter: "blur(0px)" },
          exit: {
            opacity: 0,
            y: -10,
            filter: "blur(4px)",
          },
        }}
        transition={TRANSITION_SUGGESTIONS}
      >
        {activeCategoryData?.items.map((suggestion, index) => (
          <MotionPromptSuggestion
            key={`${activeCategoryData?.label}-${suggestion}-${index}`}
            highlight={activeCategoryData.highlight}
            onClick={() => handleSuggestionClick(suggestion)}
            className="block h-full text-left [&>button]:!transition-none"
            initial="initial"
            animate="animate"
            variants={{
              initial: { opacity: 0, y: -10 },
              animate: { opacity: 1, y: 0 },
            }}
            transition={{
              ...TRANSITION_SUGGESTIONS,
              delay: index * 0.05,
            }}
          >
            {suggestion}
          </MotionPromptSuggestion>
        ))}
      </MotionWrapper>
    ),
    [handleSuggestionClick, activeCategoryData]
  );

  return (
    <AnimatePresence mode="wait" initial={false}>
      {showCategorySuggestions ? suggestionsList : suggestionsGrid}
    </AnimatePresence>
  );
});
