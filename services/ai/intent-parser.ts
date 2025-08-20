import { streamText } from "ai";
import { openai } from "@ai-sdk/openai";
import { ParsedIntent } from "@/lib/types";

// Intent parsing system prompt based on idea.md
const INTENT_PARSER_PROMPT = `You are a Solana Web3 assistant that converts a user's natural language message into a JSON intent for a blockchain-enabled chatbot.

Your job:
1. Detect if the user request is:
   - A WALLET QUERY (read-only: balances, NFTs, transaction history, fees, staking positions)
   - A MARKET QUERY (read-only: market data, prices, trends, top gainers/losers, market analysis)
   - AN ON-CHAIN ACTION (write: token transfer, token swap, staking, NFT transfer/listing)
2. Output ONLY a single valid JSON object that follows the schema.
3. Never output extra text, explanations, or formatting — only the JSON.
4. Always fill required fields; set optional ones to null if not provided.
5. For amounts, capture as strings (e.g., "5", "0.75").

Schema:
{
  "type": "query" | "action",
  "query": "portfolio" | "balances" | "nfts" | "transactions" | "history" | "activity" | "txn_history" | "fees" | "positions" | "market" | "prices" | "trends" | "gainers" | "losers" | null,
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
    'digital collectibles',
    'nft portfolio',
    'show collectibles',
    'view collectibles',
    'nft assets',
    'digital assets',
    'art collection',
    'pfp collection',
    'profile pictures',
    'compressed nfts',
    'cnfts',
    'what nfts do i have',
    'what collectibles do i own',
    'my art',
    'my pfps',
    'non-fungible tokens',
    'display nfts',
    'browse nfts'
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
 * Preprocesses user message to enhance market keyword recognition
 */
function preprocessForMarketKeywords(message: string): string {
  const lowerMessage = message.toLowerCase();
  
  // Common market-related phrases that should map to market queries
  const marketKeywords = [
    'market data',
    'market analysis', 
    'market overview',
    'market trends',
    'price analysis',
    'token prices',
    'top gainers',
    'top losers',
    'best performing',
    'worst performing',
    'market cap',
    'trading volume',
    'solana ecosystem',
    'sol ecosystem',
    'crypto market',
    'token market',
    'market sentiment',
    'price action',
    'market performance'
  ];
  
  for (const keyword of marketKeywords) {
    if (lowerMessage.includes(keyword)) {
      // Enhance the message to be more explicit about market intent
      return message + ' (show market data and analysis)';
    }
  }
  
  return message;
}

/**
 * Preprocesses user message to enhance domain keyword recognition
 */
function preprocessForDomainKeywords(message: string): string {
  const lowerMessage = message.toLowerCase();
  
  // Look for .sol domain patterns
  const solDomainPattern = /\b\w+\.sol\b/gi;
  const domainMatches = message.match(solDomainPattern);
  
  if (domainMatches && domainMatches.length > 0) {
    // Enhance the message to be more explicit about domain resolution intent
    return message + ' (resolve Solana domain to wallet address)';
  }
  
  return message;
}

/**
 * Preprocesses user message to enhance transaction keyword recognition
 */
function preprocessForTransactionKeywords(message: string): string {
  const lowerMessage = message.toLowerCase();
  
  // Common transaction-related phrases that should map to transaction queries
  const transactionKeywords = [
    'my transactions',
    'transaction history',
    'my history',
    'recent transactions',
    'past transactions',
    'activity',
    'wallet activity',
    'transaction list',
    'txn history',
    'tx history',
    'recent activity',
    'account activity',
    'payment history',
    'transfer history',
    'swap history',
    'trading history',
    'transaction summary',
    'transaction analytics',
    'what transactions',
    'show transactions',
    'view transactions',
    'list transactions',
    'transaction data',
    'transaction details',
    'transaction record',
    'transaction log',
    'wallet transactions',
    'on-chain activity',
    'blockchain activity',
    'transaction feed',
    'activity feed',
    'tell me about my transactions',
    'show me my transactions',
    'what have i been doing',
    'my recent activity'
  ];
  
  for (const keyword of transactionKeywords) {
    if (lowerMessage.includes(keyword)) {
      // Enhance the message to be more explicit about transaction intent
      return message + ' (show my transaction history and analytics)';
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
    // Preprocess message to enhance NFT, market, domain, and transaction keyword recognition
    let enhancedMessage = preprocessForNftKeywords(userMessage);
    enhancedMessage = preprocessForMarketKeywords(enhancedMessage);
    enhancedMessage = preprocessForDomainKeywords(enhancedMessage);
    enhancedMessage = preprocessForTransactionKeywords(enhancedMessage);
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
    const validQueries = [
      // Wallet-related queries
      'portfolio', 'balances', 'nfts', 'transactions', 'history', 'activity', 'txn_history', 'fees', 'positions',
      // Market-related queries
      'market', 'prices', 'trends', 'gainers', 'losers'
    ];
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
