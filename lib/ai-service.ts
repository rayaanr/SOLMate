import { streamText } from "ai";
import { openai } from "@ai-sdk/openai";
import { ParsedIntent } from "./types";
import { TOKEN_CONFIGS } from "@/data/tokens";

// Intent parsing system prompt based on idea.md
const INTENT_PARSER_PROMPT = `You are a Solana Web3 assistant that converts a user's natural language message into a JSON intent for a blockchain-enabled chatbot.

Your job:
1. Detect if the user request is:
   - A WALLET QUERY (read-only: balances, NFTs, transaction history, fees, staking positions)
   - AN ON-CHAIN ACTION (write: token transfer, token swap, staking, NFT transfer/listing)
2. Output ONLY a single valid JSON object that follows the schema.
3. Never output extra text, explanations, or formatting — only the JSON.
4. Always fill required fields; set optional ones to null if not provided.
5. For amounts, capture as strings (e.g., "5", "0.75").

Schema:
{
  "type": "query" | "action",
  "query": "portfolio" | "balances" | "nfts" | "txn_history" | "fees" | "positions" | null,
  "filters": {
    "time_range": { "from": "<ISO8601 or null>", "to": "<ISO8601 or null>" },
    "collection": "<string or null>",
    "token_mint": "<string or null>",
    "limit": <integer or null>
  },
  "action": "transfer" | "swap" | "stake" | "unstake" | "nft_transfer" | "nft_list" | null,
  "params": {
    "amount": "<string or null>",
    "token": "<symbol or null>",
    "recipient": "<address_or_handle_or_null>",
    "slippage_bps": <integer or null>,
    "market": "<string or null>",
    "protocol": "<string or null>",
    "deadline_sec": <integer or null>
  }
}`;

export class AIService {
  private model = openai("gpt-4o-mini");

  // Use centralized token configurations
  private readonly tokenConfigs = TOKEN_CONFIGS;

  private getTokenMintBySymbol(symbol: string): string {
    const config = this.tokenConfigs[symbol.toUpperCase()];
    if (!config) {
      throw new Error(`Unsupported token: ${symbol}`);
    }
    return config.mint;
  }

  private getTokenDecimalsBySymbol(symbol: string): number {
    const config = this.tokenConfigs[symbol.toUpperCase()];
    if (!config) {
      throw new Error(`Unsupported token: ${symbol}`);
    }
    return config.decimals;
  }

  async parseUserIntent(userMessage: string): Promise<ParsedIntent | null> {
    try {
      const prompt = `User message: "${userMessage}"`;

      const result = await streamText({
        model: this.model,
        system: INTENT_PARSER_PROMPT,
        prompt,
        maxOutputTokens: 1024,
      });

      // Convert stream to text
      const chunks = [];
      for await (const chunk of result.textStream) {
        chunks.push(chunk);
      }
      const jsonString = chunks.join("").trim();

      // Validate JSON structure before parsing
      if (!jsonString.startsWith("{") || !jsonString.endsWith("}")) {
        console.error("intent_parsing: Invalid JSON structure", { jsonString });
        return null;
      }

      const parsed = JSON.parse(jsonString);

      return parsed;
    } catch (error) {
      console.error("intent_parsing", error, { userMessage });
      return null;
    }
  }

  private async generateResponse(prompt: string, type: string = "general") {
    return streamText({
      model: this.model,
      prompt,
    });
  }

  async generateEnhancedResponse(
    userPrompt: string,
    intent: ParsedIntent,
    analytics: string
  ) {
    const enhancedPrompt = `User asked: "${userPrompt}"\n\nDetected Intent: ${intent.query} query\n\nWallet Analytics:\n${analytics}\n\nPlease provide a natural, conversational response about this wallet data.`;

    return this.generateResponse(enhancedPrompt, "enhanced_wallet");
  }

  async generateFallbackResponse(userPrompt: string) {
    const fallbackPrompt = `The user asked about wallet/portfolio information: "${userPrompt}"\n\nI attempted to fetch live wallet data but encountered an error. Please provide a helpful response about Solana wallets and portfolio management in general.`;

    return this.generateResponse(fallbackPrompt, "fallback");
  }

  async generateActionResponse(userPrompt: string, intent: ParsedIntent) {
    const actionResponse = `I understand you want to perform a "${intent.action}" action. For now, I can only help with wallet balance queries. Action execution will be implemented in future updates.`;

    const prompt = `User requested: "${userPrompt}"\n\nProvide this response: ${actionResponse}\n\nThen offer to help with wallet balance queries instead.`;

    return this.generateResponse(prompt, "action_acknowledgment");
  }

  async prepareTransactionIntent(
    userPrompt: string,
    intent: ParsedIntent,
    userWallet?: string
  ) {
    if (intent.type !== "action" || intent.action !== "transfer") {
      throw new Error("Invalid intent for transaction preparation");
    }

    if (!intent.params?.recipient || !intent.params?.amount) {
      throw new Error("Missing required transfer parameters");
    }

    if (!userWallet) {
      // Return a response asking user to connect wallet
      return this.generateResponse(
        `User wants to ${intent.action} but no wallet is connected. Please ask them to connect their wallet first to proceed with the transaction.`,
        "wallet_connection_required"
      );
    }

    // Prepare transaction parameters
    try {
      // Map token symbols to known tokens for SPL transfers
      const tokenConfig =
        intent.params.token && intent.params.token.toUpperCase() !== "SOL"
          ? {
              mint: this.getTokenMintBySymbol(intent.params.token),
              symbol: intent.params.token.toUpperCase(),
              decimals: this.getTokenDecimalsBySymbol(intent.params.token),
            }
          : undefined;

      // Validate and parse amount
      let amountRaw =
        typeof intent.params.amount === "string"
          ? intent.params.amount.trim()
          : String(intent.params.amount);
      let amountNum = parseFloat(amountRaw);
      if (!isFinite(amountNum) || isNaN(amountNum) || amountNum <= 0) {
        throw new Error(
          `Invalid amount: "${intent.params.amount}". Please enter a valid positive number.`
        );
      }

      const transactionParams = {
        type: "transfer" as const,
        recipient: intent.params.recipient,
        amount: amountNum,
        token: tokenConfig,
      };

      // Return streaming response with embedded transaction data
      const prompt = `The user requested: "${userPrompt}"

I have successfully prepared their transaction with the following details:
- Amount: ${transactionParams.amount} ${tokenConfig?.symbol || "SOL"}
- Recipient: ${transactionParams.recipient}
- Type: ${tokenConfig ? "SPL Token Transfer" : "SOL Transfer"}

Please provide a natural, helpful response that:
1. Confirms you've prepared the transaction
2. Summarizes what will happen (transfer ${transactionParams.amount} ${
        tokenConfig?.symbol || "SOL"
      } to ${transactionParams.recipient})
3. Tells them to review and approve the transaction
4. Is conversational and friendly

IMPORTANT: End your response with this exact transaction data:
[TRANSACTION_DATA]${JSON.stringify(transactionParams)}[/TRANSACTION_DATA]`;
      return this.generateResponse(prompt, "transaction_prepared");
    } catch (error) {
      console.error("Transaction preparation failed:", error);

      // Return error response
      const errorPrompt = `User requested: "${userPrompt}"\n\nTransaction preparation failed: ${error}\n\nPlease explain the error and suggest alternatives.`;
      return this.generateResponse(errorPrompt, "transaction_error");
    }
  }

  async prepareSwapIntent(
    userPrompt: string,
    intent: ParsedIntent,
    userWallet?: string
  ) {
    if (intent.type !== "action" || intent.action !== "swap") {
      throw new Error("Invalid intent for swap preparation");
    }

    if (!intent.params?.amount || !intent.params?.token) {
      throw new Error("Missing required swap parameters");
    }

    if (!userWallet) {
      // Return a response asking user to connect wallet
      return this.generateResponse(
        `User wants to ${intent.action} but no wallet is connected. Please ask them to connect their wallet first to proceed with the swap.`,
        "wallet_connection_required"
      );
    }

    // Parse the swap request - we need to extract both input and output tokens
    // Common patterns: "swap SOL to USDC", "swap 5 SOL for USDC", "convert SOL to USDC"
    const swapMatch = userPrompt.match(
      /(?:swap|convert)\s+(?:(\d+(?:\.\d+)?)\s+)?(\w+)\s+(?:to|for)\s+(\w+)/i
    );

    let inputToken: string;
    let outputToken: string;
    let amount: number;

    if (swapMatch) {
      // Extract from natural language
      amount = swapMatch[1]
        ? parseFloat(swapMatch[1])
        : parseFloat(intent.params.amount);
      inputToken = swapMatch[2].toUpperCase();
      outputToken = swapMatch[3].toUpperCase();
    } else {
      // Fallback to params (assume token is the input token, need to extract output)
      amount = parseFloat(intent.params.amount);
      inputToken = intent.params.token.toUpperCase();

      // Try to find output token in the message
      const outputMatch = userPrompt.match(/(?:to|for)\s+(\w+)/i);
      if (outputMatch) {
        outputToken = outputMatch[1].toUpperCase();
      } else {
        throw new Error(
          "Could not determine output token. Please specify what token to swap to (e.g., 'swap SOL to USDC')"
        );
      }
    }

    // Validate amount
    if (!isFinite(amount) || isNaN(amount) || amount <= 0) {
      throw new Error(
        `Invalid amount: "${intent.params.amount}". Please enter a valid positive number.`
      );
    }

    // Validate tokens are different
    if (inputToken === outputToken) {
      throw new Error(
        "Cannot swap a token for itself. Please specify different input and output tokens."
      );
    }

    // Prepare swap parameters
    try {
      const swapParams = {
        type: "swap" as const,
        inputToken,
        outputToken,
        amount,
      };

      // Return streaming response with embedded swap data
      const prompt = `The user requested: "${userPrompt}"

I have successfully prepared their token swap with the following details:
- Swap: ${swapParams.amount} ${inputToken} → ${outputToken}
- Type: Token Swap via Jupiter

Please provide a natural, helpful response that:
1. Confirms you've prepared the swap
2. Summarizes what will happen (swap ${
        swapParams.amount
      } ${inputToken} for ${outputToken})
3. Mentions that you'll get a quote and they can review the details
4. Tells them to review and approve the swap
5. Is conversational and friendly

IMPORTANT: End your response with this exact swap data:
[SWAP_DATA]${JSON.stringify(swapParams)}[/SWAP_DATA]`;

      return this.generateResponse(prompt, "swap_prepared");
    } catch (error) {
      console.error("Swap preparation failed:", error);

      // Return error response
      const errorPrompt = `User requested: "${userPrompt}"\n\nSwap preparation failed: ${error}\n\nPlease explain the error and suggest alternatives.`;
      return this.generateResponse(errorPrompt, "swap_error");
    }
  }

  async generateGeneralResponse(prompt: string) {
    return this.generateResponse(prompt, "general");
  }
}
