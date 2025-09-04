import { streamText } from "ai";
import { openai } from "@ai-sdk/openai";
import { ParsedIntent } from "@/lib/types";

// Intent parsing system prompt based on idea.md
const INTENT_PARSER_PROMPT = `You are a Solana Web3 assistant that converts a user's natural language message into a JSON intent for a blockchain-enabled chatbot.

IMPORTANT: Pay attention to conversation context. If the user previously requested a transaction and is now providing missing information:
- For transfers: Complete the transfer intent with the recipient address
- For swaps: When user provides just output token (like "SOL"), treat the current user message as if it said "swap [amount] [input_token] for SOL" based on previous context

Your job:
1. Detect if the user request is:
   - A WALLET QUERY (read-only: balances, NFTs, transaction history, fees, staking positions)
   - A MARKET QUERY (read-only: market data, prices, trends, top gainers/losers, market analysis)
   - AN ON-CHAIN ACTION (write: token transfer, token swap, staking, NFT transfer/listing)
   - A FOLLOW-UP providing missing information for a previous request
2. Output ONLY a single valid JSON object that follows the schema.
3. Never output extra text, explanations, or formatting — only the JSON.
4. Always fill required fields; set optional ones to null if not provided.
5. For amounts, capture as strings (e.g., \"5\", \"0.75\").
6. For transfer actions, ALWAYS extract amount, token, and recipient from user message.
7. For market queries, ALWAYS check if user is asking about a specific token and set token_mint in filters.
8. If conversation context shows a previous incomplete transaction and current message provides missing info, complete that transaction.

Transfer Examples (sending tokens to someone else):
- \"send 5 USDT to alice.sol\" → {\"type\": \"action\", \"action\": \"transfer\", \"params\": {\"amount\": \"5\", \"token\": \"USDT\", \"recipient\": \"alice.sol\"}}
- \"transfer 0.1 SOL to 7EqQdEX...\" → {\"type\": \"action\", \"action\": \"transfer\", \"params\": {\"amount\": \"0.1\", \"token\": \"SOL\", \"recipient\": \"7EqQdEX...\"}}
- \"pay 100 USDC to bob.sol\" → {\"type\": \"action\", \"action\": \"transfer\", \"params\": {\"amount\": \"100\", \"token\": \"USDC\", \"recipient\": \"bob.sol\"}}

Context-Aware Follow-up Examples:
Previous: \"I want to send 1 USDC\" (missing recipient)
Current: \"maniya.sol\" → {\"type\": \"action\", \"action\": \"transfer\", \"params\": {\"amount\": \"1\", \"token\": \"USDC\", \"recipient\": \"maniya.sol\"}}

Previous: \"I want to swap tokens\" (missing everything)
Current: \"1 USDC\" → {\"type\": \"action\", \"action\": \"swap\", \"params\": {\"amount\": \"1\", \"token\": \"USDC\"}}

Previous: \"I want to swap SOL\" (missing amount and output token)  
Current: \"5 SOL to USDC\" → {\"type\": \"action\", \"action\": \"swap\", \"params\": {\"amount\": \"5\", \"token\": \"SOL\"}}

Previous conversation shows user wants to swap 1 USDC, system asked for output token
Current: \"SOL\" → RECONSTRUCT as "swap 1 USDC for SOL" → {\"type\": \"action\", \"action\": \"swap\", \"params\": {\"amount\": \"1\", \"token\": \"USDC\"}}

Previous conversation shows user wants to swap 1 USDC, system asked for output token  
Current: \"to SOL\" → RECONSTRUCT as "swap 1 USDC for SOL" → {\"type\": \"action\", \"action\": \"swap\", \"params\": {\"amount\": \"1\", \"token\": \"USDC\"}}

Deposit Examples (creating payment request for user to receive tokens):
- \"I want to deposit 5 USDC to my wallet\" → {\"type\": \"action\", \"action\": \"deposit\", \"params\": {\"amount\": \"5\", \"token\": \"USDC\", \"recipient\": null}}
- \"create a payment request for 10 SOL\" → {\"type\": \"action\", \"action\": \"deposit\", \"params\": {\"amount\": \"10\", \"token\": \"SOL\", \"recipient\": null}}
- \"deposit 50 USDT to my account\" → {\"type\": \"action\", \"action\": \"deposit\", \"params\": {\"amount\": \"50\", \"token\": \"USDT\", \"recipient\": null}}
- \"generate QR code for 2 SOL payment\" → {\"type\": \"action\", \"action\": \"deposit\", \"params\": {\"amount\": \"2\", \"token\": \"SOL\", \"recipient\": null}}

Wallet Query Examples (read-only operations for specific wallets):
- \"what's my portfolio?\" → {\"type\": \"query\", \"query\": \"portfolio\", \"filters\": {\"time_range\": null, \"collection\": null, \"token_mint\": null, \"wallet_address\": null, \"limit\": null}}
- \"show my balances\" → {\"type\": \"query\", \"query\": \"balances\", \"filters\": {\"time_range\": null, \"collection\": null, \"token_mint\": null, \"wallet_address\": null, \"limit\": null}}
- \"my transaction history\" → {\"type\": \"query\", \"query\": \"transactions\", \"filters\": {\"time_range\": null, \"collection\": null, \"token_mint\": null, \"wallet_address\": null, \"limit\": null}}
- \"show my NFTs\" → {\"type\": \"query\", \"query\": \"nfts\", \"filters\": {\"time_range\": null, \"collection\": null, \"token_mint\": null, \"wallet_address\": null, \"limit\": null}}

Specific Wallet Query Examples:
- \"show portfolio for kXB7FfzdrfZpAZEW3TZcp8a8CwQbsowa6BdfAHZ4gVs\" → {\"type\": \"query\", \"query\": \"portfolio\", \"filters\": {\"time_range\": null, \"collection\": null, \"token_mint\": null, \"wallet_address\": \"kXB7FfzdrfZpAZEW3TZcp8a8CwQbsowa6BdfAHZ4gVs\", \"limit\": null}}
- \"what NFTs does alice.sol have?\" → {\"type\": \"query\", \"query\": \"nfts\", \"filters\": {\"time_range\": null, \"collection\": null, \"token_mint\": null, \"wallet_address\": \"alice.sol\", \"limit\": null}}
- \"transactions for 7EqQdEX...\" → {\"type\": \"query\", \"query\": \"transactions\", \"filters\": {\"time_range\": null, \"collection\": null, \"token_mint\": null, \"wallet_address\": \"7EqQdEX...\", \"limit\": null}}
- \"balance of maniya.sol\" → {\"type\": \"query\", \"query\": \"balances\", \"filters\": {\"time_range\": null, \"collection\": null, \"token_mint\": null, \"wallet_address\": \"maniya.sol\", \"limit\": null}}
- \"show me token balance of maniya.sol\" → {\"type\": \"query\", \"query\": \"balances\", \"filters\": {\"time_range\": null, \"collection\": null, \"token_mint\": null, \"wallet_address\": \"maniya.sol\", \"limit\": null}}
- \"token balances for alice.sol\" → {\"type\": \"query\", \"query\": \"balances\", \"filters\": {\"time_range\": null, \"collection\": null, \"token_mint\": null, \"wallet_address\": \"alice.sol\", \"limit\": null}}

Market Query Examples (asking about token prices or market data):
- \"what is the price of USDC\" → {\"type\": \"query\", \"query\": \"market\", \"filters\": {\"time_range\": null, \"collection\": null, \"token_mint\": \"USDC\", \"wallet_address\": null, \"limit\": null}}
- \"current price of Solana\" → {\"type\": \"query\", \"query\": \"market\", \"filters\": {\"time_range\": null, \"collection\": null, \"token_mint\": \"SOL\", \"wallet_address\": null, \"limit\": null}}
- \"how much is Jupiter worth\" → {\"type\": \"query\", \"query\": \"market\", \"filters\": {\"time_range\": null, \"collection\": null, \"token_mint\": \"JUP\", \"wallet_address\": null, \"limit\": null}}
- \"show market data\" → {\"type\": \"query\", \"query\": \"market\", \"filters\": {\"time_range\": null, \"collection\": null, \"token_mint\": null, \"wallet_address\": null, \"limit\": null}}
- \"top gainers today\" → {\"type\": \"query\", \"query\": \"gainers\", \"filters\": {\"time_range\": null, \"collection\": null, \"token_mint\": null, \"wallet_address\": null, \"limit\": null}}

Schema:
{
  \"type\": \"query\" | \"action\",
  \"query\": \"portfolio\" | \"balances\" | \"nfts\" | \"transactions\" | \"history\" | \"activity\" | \"txn_history\" | \"fees\" | \"positions\" | \"market\" | \"prices\" | \"trends\" | \"gainers\" | \"losers\" | null,
  \"filters\": {
    \"time_range\": { \"from\": \"<ISO8601 or null>\", \"to\": \"<ISO8601 or null>\" },
    \"collection\": \"<string or null>\",
    \"token_mint\": \"<string or null>\",
    \"wallet_address\": \"<address_or_domain or null>\",
    \"limit\": <integer or null>
  },
  \"action\": \"transfer\" | \"deposit\" | \"swap\" | \"stake\" | \"unstake\" | \"nft_transfer\" | \"nft_list\" | null,
  \"params\": {
    \"amount\": \"<string or null>\",
    \"token\": \"<symbol or null>\",
    \"recipient\": \"<address_or_handle_or_null>\",
    \"slippage_bps\": <integer or null>,
    \"market\": \"<string or null>\",
    \"protocol\": \"<string or null>\",
    \"deadline_sec\": <integer or null>
  }
}`

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
  const solDomainPattern = /\b[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.sol\b/i;
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
export async function parseUserIntent(userMessage: string, conversationContext?: string): Promise<ParsedIntent | null> {
  const model = openai("gpt-4o-mini");

  try {
    // Preprocess message to enhance NFT, market, domain, and transaction keyword recognition
    let enhancedMessage = preprocessForNftKeywords(userMessage);
    enhancedMessage = preprocessForMarketKeywords(enhancedMessage);
    enhancedMessage = preprocessForDomainKeywords(enhancedMessage);
    enhancedMessage = preprocessForTransactionKeywords(enhancedMessage);
    
    // Build prompt with or without conversation context
    const prompt = conversationContext 
      ? `Conversation context:\n${conversationContext}\n\nCurrent user message: "${enhancedMessage}"`
      : `User message: "${enhancedMessage}"`;

    const result = streamText({
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
    const validActions = ['transfer', 'deposit', 'swap', 'stake', 'unstake', 'nft_transfer', 'nft_list'];
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
