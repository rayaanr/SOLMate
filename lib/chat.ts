/**
 * Generates a unique chat ID using crypto.randomUUID() if available,
 * otherwise falls back to a timestamp-based UUID alternative
 */
export function generateChatId(): string {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    return crypto.randomUUID();
  }

  // Fallback for environments where crypto.randomUUID is not available
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}
