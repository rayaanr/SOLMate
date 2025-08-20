import { ParsedIntent } from "@/lib/types";
import { parseUserIntent, validateIntent, categorizeIntent } from "./intent-parser";
import { 
  generateResponse,
  generateEnhancedResponse,
  generateFallbackResponse,
  generateActionResponse,
  generateGeneralResponse
} from "./response-generator";
import { prepareTransactionIntent } from "../transaction/transaction-preparer";
import { prepareSwapIntent } from "../transaction/swap-preparer";

/**
 * Main AI Service class that orchestrates all AI-related functionality
 */
export class AIService {
  /**
   * Parse user message into structured intent
   */
  async parseUserIntent(userMessage: string): Promise<ParsedIntent | null> {
    return parseUserIntent(userMessage);
  }

  /**
   * Validate parsed intent structure
   */
  validateIntent(intent: ParsedIntent): boolean {
    return validateIntent(intent);
  }

  /**
   * Categorize intent for routing
   */
  categorizeIntent(intent: ParsedIntent) {
    return categorizeIntent(intent);
  }

  /**
   * Generate enhanced response with wallet analytics
   */
  async generateEnhancedResponse(
    userPrompt: string,
    intent: ParsedIntent,
    analytics: string
  ) {
    return generateEnhancedResponse(userPrompt, intent, analytics);
  }

  /**
   * Generate fallback response when data fetching fails
   */
  async generateFallbackResponse(userPrompt: string) {
    return generateFallbackResponse(userPrompt);
  }

  /**
   * Generate response for unsupported actions
   */
  async generateActionResponse(userPrompt: string, intent: ParsedIntent) {
    return generateActionResponse(userPrompt, intent);
  }

  /**
   * Generate general conversational response
   */
  async generateGeneralResponse(prompt: string) {
    return generateGeneralResponse(prompt);
  }

  /**
   * Generate raw response from prompt
   */
  async generateResponse(prompt: string, type: string = "general") {
    return generateResponse(prompt, type);
  }

  /**
   * Prepare transaction intent and generate response
   */
  async prepareTransactionIntent(
    userPrompt: string,
    intent: ParsedIntent,
    userWallet?: string
  ) {
    return prepareTransactionIntent(userPrompt, intent, userWallet);
  }

  /**
   * Prepare swap intent and generate response
   */
  async prepareSwapIntent(
    userPrompt: string,
    intent: ParsedIntent,
    userWallet?: string
  ) {
    return prepareSwapIntent(userPrompt, intent, userWallet);
  }

  /**
   * Route intent to appropriate handler
   */
  async handleIntent(
    userPrompt: string,
    intent: ParsedIntent,
    userWallet?: string
  ) {
    const category = this.categorizeIntent(intent);

    if (category.actionType === "transfer" || category.actionType === "deposit") {
      return this.prepareTransactionIntent(userPrompt, intent, userWallet);
    }

    if (category.actionType === "swap") {
      return this.prepareSwapIntent(userPrompt, intent, userWallet);
    }

    // For other actions, generate acknowledgment response
    if (category.intentType === "action") {
      return this.generateActionResponse(userPrompt, intent);
    }

    // For queries without wallet data, generate fallback
    return this.generateFallbackResponse(userPrompt);
  }
}
