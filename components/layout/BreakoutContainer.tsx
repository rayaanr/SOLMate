"use client";

import { motion } from "motion/react";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { BREAKOUT_TRANSITION } from "@/lib/motion";

interface BreakoutContainerProps {
  children: React.ReactNode;
  className?: string;
  gutterPx?: number;
  animateFromClamp?: boolean;
}

export function BreakoutContainer({
  children,
  className,
  gutterPx = 16,
  animateFromClamp = true,
}: BreakoutContainerProps) {
  const [expanded, setExpanded] = useState(!animateFromClamp);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    // Check for reduced motion preference
    if (typeof window !== "undefined") {
      const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
      setPrefersReducedMotion(mediaQuery.matches);
      
      const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
      mediaQuery.addEventListener("change", handler);
      return () => mediaQuery.removeEventListener("change", handler);
    }
  }, []);

  useEffect(() => {
    if (animateFromClamp && !expanded && !prefersReducedMotion) {
      // Use requestAnimationFrame to ensure we start from the constrained state
      // before animating to expanded
      const timer = requestAnimationFrame(() => {
        setExpanded(true);
      });
      return () => cancelAnimationFrame(timer);
    }
  }, [animateFromClamp, expanded, prefersReducedMotion]);

  // For reduced motion, render in expanded state immediately
  useEffect(() => {
    if (prefersReducedMotion && animateFromClamp) {
      setExpanded(true);
    }
  }, [prefersReducedMotion, animateFromClamp]);

  const transition = prefersReducedMotion 
    ? { duration: 0 }
    : BREAKOUT_TRANSITION;

  return (
    <motion.div
      className={cn("relative w-full", className)}
      initial={
        animateFromClamp
          ? {
              marginLeft: 0,
              marginRight: 0,
              width: "100%",
            }
          : {
              marginLeft: `calc(50% - 50vw + ${gutterPx}px)`,
              marginRight: `calc(50% - 50vw + ${gutterPx}px)`,
              width: `calc(100vw - ${gutterPx * 2}px)`,
            }
      }
      animate={
        expanded
          ? {
              marginLeft: `calc(50% - 50vw + ${gutterPx}px)`,
              marginRight: `calc(50% - 50vw + ${gutterPx}px)`,
              width: `calc(100vw - ${gutterPx * 2}px)`,
            }
          : {
              marginLeft: 0,
              marginRight: 0,
              width: "100%",
            }
      }
      transition={transition}
      layout
      style={{
        "--breakout-gutter": `${gutterPx}px`,
      } as React.CSSProperties}
    >
      <div className="mx-auto w-full px-4 md:px-6 lg:px-8 overflow-x-auto">
        {children}
      </div>
    </motion.div>
  );
}
