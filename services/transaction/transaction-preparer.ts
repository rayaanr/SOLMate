import { ParsedIntent } from "@/lib/types";
import { getTokenMintBySymbol, getTokenDecimalsBySymbol } from "@/data/tokens";
import { generateResponse, generateWalletConnectionResponse } from "../ai/response-generator";

interface TransactionParams {
  type: "transfer";
  recipient: string;
  amount: number;
  token?: {
    mint: string;
    symbol: string;
    decimals: number;
  };
}

/**
 * Validates transaction intent parameters
 */
export function validateTransactionIntent(intent: ParsedIntent): void {
  if (intent.type !== "action" || intent.action !== "transfer") {
    throw new Error("Invalid intent for transaction preparation");
  }

  if (!intent.params?.recipient || !intent.params?.amount) {
    throw new Error("Missing required transfer parameters");
  }
}

/**
 * Validates and parses transaction amount
 */
export function parseTransactionAmount(amountInput: string | number): number {
  const amountRaw = typeof amountInput === "string" 
    ? amountInput.trim() 
    : String(amountInput);
    
  const amountNum = parseFloat(amountRaw);
  
  if (!isFinite(amountNum) || isNaN(amountNum) || amountNum <= 0) {
    throw new Error(
      `Invalid amount: "${amountInput}". Please enter a valid positive number.`
    );
  }
  
  return amountNum;
}

/**
 * Creates token configuration for SPL transfers
 */
export function createTokenConfig(tokenSymbol: string): {
  mint: string;
  symbol: string;
  decimals: number;
} | undefined {
  if (!tokenSymbol || tokenSymbol.toUpperCase() === "SOL") {
    return undefined;
  }

  try {
    return {
      mint: getTokenMintBySymbol(tokenSymbol),
      symbol: tokenSymbol.toUpperCase(),
      decimals: getTokenDecimalsBySymbol(tokenSymbol),
    };
  } catch (error) {
    throw new Error(`Unsupported token: ${tokenSymbol}`);
  }
}

/**
 * Builds transaction parameters object
 */
export function buildTransactionParams(
  intent: ParsedIntent,
  amount: number,
  tokenConfig?: {
    mint: string;
    symbol: string;
    decimals: number;
  }
): TransactionParams {
  return {
    type: "transfer" as const,
    recipient: intent.params!.recipient!,
    amount,
    token: tokenConfig,
  };
}

/**
 * Creates response prompt for transaction preparation
 */
export function createTransactionPrompt(
  userPrompt: string,
  transactionParams: TransactionParams
): string {
  return `The user requested: "${userPrompt}"

I have successfully prepared their transaction with the following details:
- Amount: ${transactionParams.amount} ${transactionParams.token?.symbol || "SOL"}
- Recipient: ${transactionParams.recipient}
- Type: ${transactionParams.token ? "SPL Token Transfer" : "SOL Transfer"}

Please provide a natural, helpful response that:
1. Confirms you've prepared the transaction
2. Summarizes what will happen (transfer ${transactionParams.amount} ${
    transactionParams.token?.symbol || "SOL"
  } to ${transactionParams.recipient})
3. Tells them to review and approve the transaction
4. Is conversational and friendly

IMPORTANT: End your response with this exact transaction data:
[TRANSACTION_DATA]${JSON.stringify(transactionParams)}[/TRANSACTION_DATA]`;
}

/**
 * Creates error response prompt for transaction failures
 */
export function createTransactionErrorPrompt(
  userPrompt: string,
  error: unknown
): string {
  return `User requested: "${userPrompt}"

Transaction preparation failed: ${error}

Please explain the error and suggest alternatives.`;
}

/**
 * Prepares transaction intent and generates appropriate response
 */
export async function prepareTransactionIntent(
  userPrompt: string,
  intent: ParsedIntent,
  userWallet?: string
) {
  try {
    // Validate basic intent structure
    validateTransactionIntent(intent);

    // Check wallet connection
    if (!userWallet) {
      return generateWalletConnectionResponse(intent.action!);
    }

    // Parse and validate amount
    const amount = parseTransactionAmount(intent.params!.amount!);

    // Create token configuration if needed
    const tokenConfig = intent.params!.token 
      ? createTokenConfig(intent.params!.token)
      : undefined;

    // Build transaction parameters
    const transactionParams = buildTransactionParams(intent, amount, tokenConfig);

    // Generate response with transaction data
    const prompt = createTransactionPrompt(userPrompt, transactionParams);
    return generateResponse(prompt, "transaction_prepared");
    
  } catch (error) {
    console.error("Transaction preparation failed:", error);

    // Generate error response
    const errorPrompt = createTransactionErrorPrompt(userPrompt, error);
    return generateResponse(errorPrompt, "transaction_error");
  }
}
