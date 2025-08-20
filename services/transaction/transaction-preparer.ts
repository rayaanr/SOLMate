import { ParsedIntent } from "@/lib/types";
import { getTokenMintBySymbol, getTokenDecimalsBySymbol } from "@/data/tokens";
import { generateResponse, generateWalletConnectionResponse } from "../ai/response-generator";
import { resolveRecipient, isValidRecipient, DomainResolutionResult } from "../domain/domain-resolution";
import { Connection } from "@solana/web3.js";

interface TransactionParams {
  type: "transfer" | "deposit";
  recipient: string;
  amount: number;
  token?: {
    mint: string;
    symbol: string;
    decimals: number;
  };
  // Domain resolution info
  domainInfo?: {
    originalInput: string;
    domain: string;
    resolvedAddress: string;
    isResolved: boolean;
  };
}

/**
 * Validates transaction intent parameters
 */
export function validateTransactionIntent(intent: ParsedIntent, userWallet?: string): void {
  console.log("🔍 Transaction intent validation:", JSON.stringify(intent, null, 2));
  
  if (intent.type !== "action" || !["transfer", "deposit"].includes(intent.action || "")) {
    throw new Error("Invalid intent for transaction preparation");
  }

  // For deposits, if recipient is null and we have a user wallet, use the user wallet as recipient
  if (intent.action === "deposit" && !intent.params?.recipient && userWallet) {
    intent.params = intent.params || {};
    intent.params.recipient = userWallet;
    console.log("✅ Set user wallet as recipient for deposit:", userWallet);
  }

  if (!intent.params?.recipient || !intent.params?.amount) {
    console.error("❌ Missing transaction parameters:", {
      action: intent.action,
      hasRecipient: !!intent.params?.recipient,
      hasAmount: !!intent.params?.amount,
      params: intent.params
    });
    throw new Error("Missing required transaction parameters");
  }
  
  console.log("✅ Transaction intent is valid:", {
    action: intent.action,
    recipient: intent.params.recipient,
    amount: intent.params.amount,
    token: intent.params.token
  });
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
 * Builds transaction parameters object with domain resolution
 */
export function buildTransactionParams(
  intent: ParsedIntent,
  amount: number,
  tokenConfig?: {
    mint: string;
    symbol: string;
    decimals: number;
  },
  domainResolution?: DomainResolutionResult
): TransactionParams {
  const params: TransactionParams = {
    type: (intent.action === "deposit" ? "deposit" : "transfer") as "transfer" | "deposit",
    recipient: domainResolution?.address || intent.params!.recipient!,
    amount,
    token: tokenConfig,
  };

  // Add domain info if recipient was resolved from a domain
  if (domainResolution?.isResolved) {
    params.domainInfo = {
      originalInput: intent.params!.recipient!,
      domain: domainResolution.domain,
      resolvedAddress: domainResolution.address,
      isResolved: true,
    };
  }

  return params;
}

/**
 * Creates response prompt for transaction preparation
 */
export function createTransactionPrompt(
  userPrompt: string,
  transactionParams: TransactionParams
): string {
  const isDeposit = transactionParams.type === "deposit";
  const actionWord = isDeposit ? "payment request" : "transfer";
  const actionDescription = isDeposit 
    ? `create a payment request for ${transactionParams.amount} ${transactionParams.token?.symbol || "SOL"} to your wallet`
    : `transfer ${transactionParams.amount} ${transactionParams.token?.symbol || "SOL"} to ${transactionParams.recipient}`;
  
  return `The user requested: "${userPrompt}"

I have successfully prepared their ${actionWord} with the following details:
- Amount: ${transactionParams.amount} ${transactionParams.token?.symbol || "SOL"}
- ${isDeposit ? "Your wallet" : "Recipient"}: ${transactionParams.recipient}
- Type: ${isDeposit ? (transactionParams.token ? "SPL Token Payment Request" : "SOL Payment Request") : (transactionParams.token ? "SPL Token Transfer" : "SOL Transfer")}

Please provide a natural, helpful response that:
1. Confirms you've prepared the ${actionWord}
2. Summarizes what will happen (${actionDescription})
3. ${isDeposit ? "Explains that this creates a QR code/link for others to pay them" : "Tells them to review and approve the transaction"}
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
    // Validate basic intent structure (passing userWallet for deposit handling)
    validateTransactionIntent(intent, userWallet);

    // Check wallet connection
    if (!userWallet) {
      return generateWalletConnectionResponse(intent.action!);
    }

    // Validate recipient format (address or domain)
    if (!isValidRecipient(intent.params!.recipient!)) {
      throw new Error(
        `Invalid recipient format: ${intent.params!.recipient}. Must be a valid wallet address or .sol domain`
      );
    }

    // Resolve recipient (domain to address if needed)
    let domainResolution: DomainResolutionResult | undefined;
    try {
      // Reuse a shared connection if available
      const connection = new Connection(
          process.env.NEXT_PUBLIC_HELIUS_RPC_URL ||
            'https://api.mainnet-beta.solana.com'
        );
      // Optionally assign for reuse
      // @ts-expect-error - attach for simple reuse in runtime
      globalThis.__sharedSolanaConn = connection;

      domainResolution = await resolveRecipient(intent.params!.recipient!, connection);
    } catch (error) {
      throw new Error(
        `Failed to resolve recipient: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }

    // Parse and validate amount
    const amount = parseTransactionAmount(intent.params!.amount!);

    // Create token configuration if needed
    const tokenConfig = intent.params!.token 
      ? createTokenConfig(intent.params!.token)
      : undefined;

    // Build transaction parameters with domain resolution
    const transactionParams = buildTransactionParams(intent, amount, tokenConfig, domainResolution);

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
