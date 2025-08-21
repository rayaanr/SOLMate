export const TRANSITION_SUGGESTIONS = {
  duration: 0.4,
  type: "spring" as const,
  damping: 25,
  stiffness: 300,
};

export const TRANSITION_DEFAULT = {
  type: "spring" as const,
  duration: 0.2,
  bounce: 0,
};

export const TRANSITION_FAST = {
  type: "spring" as const,
  duration: 0.15,
  bounce: 0,
};

export const TRANSITION_SLOW = {
  type: "spring" as const,
  duration: 0.4,
  bounce: 0.1,
};

export const TRANSITION_CONTENT = {
  ease: "easeOut",
  duration: 0.2,
};

// Common animation variants
export const FADE_VARIANTS = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
};

export const SLIDE_UP_VARIANTS = {
  initial: { opacity: 0, y: -8 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: 8 },
};

export const SCALE_VARIANTS = {
  initial: { opacity: 0, scale: 0.95 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.98 },
};

export const HEIGHT_VARIANTS = {
  initial: { height: 0, opacity: 0 },
  animate: { height: "auto", opacity: 1 },
  exit: { height: 0, opacity: 0 },
};
