"use client";

import { motion } from "motion/react";
import React, { forwardRef } from "react";

interface MotionWrapperProps {
  children: React.ReactNode;
  className?: string;
  [key: string]: any;
}

/**
 * A wrapper component that disables CSS transitions on child elements
 * to prevent conflicts with Framer Motion animations
 */
export const MotionWrapper = forwardRef<HTMLDivElement, MotionWrapperProps>(
  ({ children, className = "", ...props }, ref) => (
    <motion.div
      ref={ref}
      className={`[&_*]:!transition-none [&_button]:!transition-none ${className}`}
      {...props}
    >
      {children}
    </motion.div>
  )
);

MotionWrapper.displayName = "MotionWrapper";
