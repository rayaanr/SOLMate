import { streamText } from "ai";
import { openai } from "@ai-sdk/openai";
import { ParsedIntent } from "@/lib/types";

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
  "query": "portfolio" | "balances" | "nfts" | "transactions" | "history" | "activity" | "txn_history" | "fees" | "positions" | null,
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

/**
 * Preprocesses user message to enhance NFT keyword recognition
 */
function preprocessForNftKeywords(message: string): string {
  const lowerMessage = message.toLowerCase();
  
  // Common NFT-related phrases that should map to "nfts" query
  const nftKeywords = [
    'my nfts',
    'my collectibles', 
    'nft collection',
    'nft gallery',
    'view nfts',
    'show nfts',
    'list nfts',
    'collectibles gallery',
    'digital collectibles'
  ];
  
  for (const keyword of nftKeywords) {
    if (lowerMessage.includes(keyword)) {
      // Enhance the message to be more explicit about NFT intent
      return message + ' (show my NFTs portfolio)';
    }
  }
  
  return message;
}

/**
 * Parses user messages into structured intents using OpenAI
 */
export async function parseUserIntent(userMessage: string): Promise<ParsedIntent | null> {
  const model = openai("gpt-4o-mini");

  try {
    // Preprocess message to enhance NFT keyword recognition
    const enhancedMessage = preprocessForNftKeywords(userMessage);
    const prompt = `User message: "${enhancedMessage}"`;

    const result = await streamText({
      model,
      system: INTENT_PARSER_PROMPT,
      prompt,
    });

    // Convert stream to text
    const chunks = [];
    for await (const chunk of result.textStream) {
      chunks.push(chunk);
    }
    const jsonString = chunks.join("").trim();

    const parsed = JSON.parse(jsonString);
    return parsed;
  } catch (error) {
    console.error("intent_parsing", error, { userMessage });
    return null;
  }
}

/**
 * Validates if a parsed intent has the required structure
 */
export function validateIntent(intent: ParsedIntent): boolean {
  if (!intent || typeof intent !== 'object') {
    return false;
  }

  // Check required fields
  if (!intent.type || !['query', 'action'].includes(intent.type)) {
    return false;
  }

  // Validate query-specific fields
  if (intent.type === 'query') {
    const validQueries = ['portfolio', 'balances', 'nfts', 'transactions', 'history', 'activity', 'txn_history', 'fees', 'positions'];
    if (intent.query && !validQueries.includes(intent.query)) {
      return false;
    }
  }

  // Validate action-specific fields
  if (intent.type === 'action') {
    const validActions = ['transfer', 'swap', 'stake', 'unstake', 'nft_transfer', 'nft_list'];
    if (intent.action && !validActions.includes(intent.action)) {
      return false;
    }
  }

  return true;
}

/**
 * Categorizes intent types for routing purposes
 */
export function categorizeIntent(intent: ParsedIntent): {
  intentType: 'query' | 'action';
  queryType: string | null;
  actionType: string | null;
  hasIntent: boolean;
} {
  return {
    intentType: intent.type,
    queryType: intent.type === 'query' ? (intent.query || null) : null,
    actionType: intent.type === 'action' ? (intent.action || null) : null,
    hasIntent: !!(intent.query || intent.action)
  };
}
