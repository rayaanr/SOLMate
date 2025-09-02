import { ParsedIntent } from "@/lib/types";
import { generateResponse, generateWalletConnectionResponse } from "../ai/response-generator";

interface SwapParams {
  type: "swap";
  inputToken: string;
  outputToken: string;
  amount: number;
}

/**
 * Validates swap intent parameters
 */
export function validateSwapIntent(intent: ParsedIntent): void {
  if (intent.type !== "action" || intent.action !== "swap") {
    throw new Error("Invalid intent for swap preparation");
  }

  if (!intent.params?.amount || !intent.params?.token) {
    throw new Error("Missing required swap parameters");
  }
}

/**
 * Validates and parses swap amount
 */
export function parseSwapAmount(amountInput: string | number): number {
  const amount = parseFloat(String(amountInput));
  
  if (!isFinite(amount) || isNaN(amount) || amount <= 0) {
    throw new Error(
      `Invalid amount: "${amountInput}". Please enter a valid positive number.`
    );
  }
  
  return amount;
}

/**
 * Extracts input and output tokens from user message and intent
 */
export function extractSwapTokens(
  userPrompt: string,
  intent: ParsedIntent
): { inputToken: string; outputToken: string; amount: number } {
  // Parse the swap request using numbered capture groups (ES2017 compatible)
  // Common patterns: "swap SOL to USDC", "swap 5 SOL for USDC", "convert SOL to USDC"
  // Groups: [1] = amount (optional), [2] = inputToken, [3] = outputToken
  const swapMatch = userPrompt.match(/(?:swap|convert)\s+(?:(\d+(?:\.\d+)?)\s+)?(\w+)\s+(?:to|for)\s+(\w+)/i);
  
  let inputToken: string;
  let outputToken: string;
  let amount: number;

  if (swapMatch) {
    // Extract from natural language using numbered groups
    if (swapMatch[1]) {
      amount = parseFloat(swapMatch[1]);
    } else if (intent.params?.amount) {
      amount = parseFloat(intent.params.amount);
    } else {
      throw new Error("Amount is required for swap. Please specify an amount (e.g., 'swap 5 SOL to USDC')");
    }
    
    inputToken = swapMatch[2].toUpperCase();
    outputToken = swapMatch[3].toUpperCase();
  } else {
    // Fallback to params - use intent.params.token for inputToken
    if (!intent.params?.amount) {
      throw new Error("Amount is required for swap. Please specify an amount.");
    }
    
    amount = parseFloat(intent.params.amount);
    
    if (intent.params.token) {
      inputToken = intent.params.token.toUpperCase();
    } else {
      throw new Error("Input token is required for swap.");
    }
    
    // Try to extract output token from the message
    const outputMatch = userPrompt.match(/(?:to|for)\s+(\w+)/i);
    if (outputMatch) {
      outputToken = outputMatch[1].toUpperCase();
    } else {
      throw new Error("Could not determine output token. Please specify what token to swap to (e.g., 'swap SOL to USDC')");
    }
  }

  return { inputToken, outputToken, amount };
}

/**
 * Validates swap tokens are different
 */
export function validateSwapTokens(inputToken: string, outputToken: string): void {
  if (inputToken === outputToken) {
    throw new Error("Cannot swap a token for itself. Please specify different input and output tokens.");
  }
}

/**
 * Builds swap parameters object
 */
export function buildSwapParams(
  inputToken: string,
  outputToken: string,
  amount: number
): SwapParams {
  return {
    type: "swap" as const,
    inputToken,
    outputToken,
    amount,
  };
}

/**
 * Creates response prompt for swap preparation
 */
export function createSwapPrompt(
  userPrompt: string,
  swapParams: SwapParams
): string {
  return `The user requested: "${userPrompt}"

I have successfully prepared their token swap with the following details:
- Swap: ${swapParams.amount} ${swapParams.inputToken} → ${swapParams.outputToken}
- Type: Token Swap via Jupiter

Please provide a natural, helpful response that:
1. Confirms you've prepared the swap
2. Summarizes what will happen (swap ${swapParams.amount} ${swapParams.inputToken} for ${swapParams.outputToken})
3. Mentions that you'll get a quote and they can review the details
4. Tells them to review and approve the swap
5. Is conversational and friendly

IMPORTANT: End your response with this exact swap data:
[SWAP_DATA]${JSON.stringify(swapParams)}[/SWAP_DATA]`;
}

/**
 * Creates error response prompt for swap failures
 */
export function createSwapErrorPrompt(
  userPrompt: string,
  error: unknown
): string {
  return `User requested: "${userPrompt}"

Swap preparation failed: ${error}

Please explain the error and suggest alternatives.`;
}

/**
 * Creates friendly response asking for missing swap parameters
 */
export function createMissingSwapParameterPrompt(
  userPrompt: string,
  intent: ParsedIntent,
  missingParam: 'token' | 'amount' | 'output_token'
): string {
  const inputToken = intent.params?.token;
  const amount = intent.params?.amount;
  
  if (missingParam === 'token' || missingParam === 'output_token') {
    if (!inputToken && !amount) {
      return `I'd be happy to help you with a token swap! 

Could you tell me what tokens you'd like to swap? For example:
- "swap SOL to USDC"
- "swap 5 BONK for USDT"

Be brief and helpful, not verbose.`;
    } else if (inputToken && amount) {
      return `I see you want to swap ${amount} ${inputToken}, but I need to know what token you'd like to swap it for.

What token would you like to receive? (e.g., USDC, SOL, BONK)

Be brief and helpful, not verbose.`;
    } else if (inputToken) {
      return `I see you want to swap ${inputToken}. Could you tell me:
1. How much ${inputToken} you want to swap?
2. What token you'd like to swap it for?

Be brief and helpful, not verbose.`;
    }
  } else if (missingParam === 'amount') {
    return `I see you want to swap ${inputToken}, but I need to know how much you'd like to swap.

How much ${inputToken} would you like to swap?

Be brief and helpful, not verbose.`;
  }
  
  return `I'd be happy to help with your token swap! Could you provide more details about what you'd like to swap?

Be brief and helpful, not verbose.`;
}

/**
 * Prepares swap intent and generates appropriate response
 */
export async function prepareSwapIntent(
  userPrompt: string,
  intent: ParsedIntent,
  userWallet?: string
) {
  try {
    // Check if basic intent structure is valid
    if (intent.type !== "action" || intent.action !== "swap") {
      throw new Error("Invalid intent for swap preparation");
    }

    // Check for missing parameters and generate friendly responses
    if (!intent.params?.amount || !intent.params?.token) {
      if (!intent.params?.amount && !intent.params?.token) {
        const prompt = createMissingSwapParameterPrompt(userPrompt, intent, 'token');
        return generateResponse(prompt, "missing_swap_parameter");
      } else if (!intent.params?.amount) {
        const prompt = createMissingSwapParameterPrompt(userPrompt, intent, 'amount');
        return generateResponse(prompt, "missing_swap_parameter");
      } else if (!intent.params?.token) {
        const prompt = createMissingSwapParameterPrompt(userPrompt, intent, 'token');
        return generateResponse(prompt, "missing_swap_parameter");
      }
    }

    // Check wallet connection
    if (!userWallet) {
      return generateWalletConnectionResponse(intent.action!);
    }

    // Now that we have basic parameters, do the full validation
    validateSwapIntent(intent);

    // Extract and validate tokens and amount
    const { inputToken, outputToken, amount } = extractSwapTokens(userPrompt, intent);
    
    // Validate amount
    const validatedAmount = parseSwapAmount(amount);
    
    // Validate tokens are different
    validateSwapTokens(inputToken, outputToken);

    // Build swap parameters
    const swapParams = buildSwapParams(inputToken, outputToken, validatedAmount);

    // Generate response with swap data
    const prompt = createSwapPrompt(userPrompt, swapParams);
    return generateResponse(prompt, "swap_prepared");
    
  } catch (error) {
    console.error("Swap preparation failed:", error);

    // Generate error response
    const errorPrompt = createSwapErrorPrompt(userPrompt, error);
    return generateResponse(errorPrompt, "swap_error");
  }
}
