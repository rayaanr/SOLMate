import { streamText } from "ai";
import { openai } from "@ai-sdk/openai";
import { ParsedIntent } from "./types";
import { debugLogger } from "./debug";

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

  // Common token configurations
  private readonly tokenConfigs: Record<
    string,
    { mint: string; decimals: number }
  > = {
    USDC: {
      mint: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
      decimals: 6,
    },
    USDT: {
      mint: "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB",
      decimals: 6,
    },
    BONK: {
      mint: "DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263",
      decimals: 5,
    },
    ONESOL: {
      mint: "4ThReWAbAVZjNVgs5Ui9Pk3cZ5TYaD9u6Y89fp6EFzoF",
      decimals: 8,
    },
  };

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
      debugLogger.log("intent_parsing", "Starting intent parsing", {
        userMessage,
      });

      const prompt = `User message: "${userMessage}"`;
      debugLogger.logOpenAI("SEND", prompt, {
        model: "gpt-4o-mini",
        system: "INTENT_PARSER_PROMPT",
        type: "intent_parsing",
      });

      const result = await streamText({
        model: this.model,
        system: INTENT_PARSER_PROMPT,
        prompt,
      });

      // Convert stream to text
      const chunks = [];
      for await (const chunk of result.textStream) {
        chunks.push(chunk);
      }
      const jsonString = chunks.join("").trim();

      debugLogger.logOpenAI("RECEIVE", jsonString, {
        type: "intent_parsing_result",
        length: jsonString.length,
      });

      const parsed = JSON.parse(jsonString);
      debugLogger.log("intent_parsing", "Successfully parsed intent", parsed);

      return parsed;
    } catch (error) {
      debugLogger.logError("intent_parsing", error, { userMessage });
      return null;
    }
  }

  private async generateResponse(prompt: string, type: string = "general") {
    debugLogger.logOpenAI("SEND", prompt, {
      model: "gpt-4o-mini",
      type,
    });

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
    debugLogger.log(
      "response_generation",
      "Generating enhanced response with analytics",
      {
        userPrompt,
        intent,
        analyticsLength: analytics.length,
      }
    );

    const enhancedPrompt = `User asked: "${userPrompt}"\n\nDetected Intent: ${intent.query} query\n\nWallet Analytics:\n${analytics}\n\nPlease provide a natural, conversational response about this wallet data.`;

    return this.generateResponse(enhancedPrompt, "enhanced_wallet");
  }

  async generateFallbackResponse(userPrompt: string) {
    debugLogger.log("response_generation", "Generating fallback response", {
      userPrompt,
    });

    const fallbackPrompt = `The user asked about wallet/portfolio information: "${userPrompt}"\n\nI attempted to fetch live wallet data but encountered an error. Please provide a helpful response about Solana wallets and portfolio management in general.`;

    return this.generateResponse(fallbackPrompt, "fallback");
  }

  async generateActionResponse(userPrompt: string, intent: ParsedIntent) {
    debugLogger.log("response_generation", "Generating action response", {
      userPrompt,
      action: intent.action,
    });

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

      const transactionParams = {
        type: "transfer" as const,
        recipient: intent.params.recipient,
        amount: parseFloat(intent.params.amount),
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

  async generateGeneralResponse(prompt: string) {
    debugLogger.log("response_generation", "Generating general response", {
      prompt,
    });
    return this.generateResponse(prompt, "general");
  }
}
