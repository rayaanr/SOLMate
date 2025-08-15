import { streamText } from "ai";
import { openai } from "@ai-sdk/openai";
import { ParsedIntent } from "@/lib/types";

const model = openai("gpt-4o-mini");

/**
 * Base response generation function with logging
 */
export async function generateResponse(prompt: string, type: string = "general") {
  return streamText({
    model,
    prompt,
  });
}

/**
 * Generate enhanced response with wallet analytics
 */
export async function generateEnhancedResponse(
  userPrompt: string,
  intent: ParsedIntent,
  analytics: string
) {
  const enhancedPrompt = `User asked: "${userPrompt}"

Detected Intent: ${intent.query} query

Wallet Analytics:
${analytics}

Please provide a natural, conversational response about this wallet data.`;

  return generateResponse(enhancedPrompt, "enhanced_wallet");
}

/**
 * Generate fallback response when data fetching fails
 */
export async function generateFallbackResponse(userPrompt: string) {
  const fallbackPrompt = `The user asked about wallet/portfolio information: "${userPrompt}"

I attempted to fetch live wallet data but encountered an error. Please provide a helpful response about Solana wallets and portfolio management in general.`;

  return generateResponse(fallbackPrompt, "fallback");
}

/**
 * Generate response for action acknowledgment (when actions aren't implemented)
 */
export async function generateActionResponse(userPrompt: string, intent: ParsedIntent) {
  const actionResponse = `I understand you want to perform a "${intent.action}" action. For now, I can only help with wallet balance queries. Action execution will be implemented in future updates.`;

  const prompt = `User requested: "${userPrompt}"

Provide this response: ${actionResponse}

Then offer to help with wallet balance queries instead.`;

  return generateResponse(prompt, "action_acknowledgment");
}

/**
 * Generate general conversational response
 */
export async function generateGeneralResponse(prompt: string) {
  return generateResponse(prompt, "general");
}

/**
 * Generate response asking user to connect wallet
 */
export async function generateWalletConnectionResponse(action: string) {
  const prompt = `User wants to ${action} but no wallet is connected. Please ask them to connect their wallet first to proceed with the ${action}.`;
  
  return generateResponse(prompt, "wallet_connection_required");
}
