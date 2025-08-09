import { streamText } from "ai";
import { openai } from "@ai-sdk/openai";
import { config } from "./config";
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

  async parseUserIntent(userMessage: string): Promise<ParsedIntent | null> {
    try {
      debugLogger.log('intent_parsing', 'Starting intent parsing', { userMessage });
      
      const prompt = `User message: "${userMessage}"`;
      debugLogger.logOpenAI('SEND', prompt, { 
        model: 'gpt-4o-mini',
        system: 'INTENT_PARSER_PROMPT',
        type: 'intent_parsing'
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
      
      debugLogger.logOpenAI('RECEIVE', jsonString, { 
        type: 'intent_parsing_result',
        length: jsonString.length
      });

      const parsed = JSON.parse(jsonString);
      debugLogger.log('intent_parsing', 'Successfully parsed intent', parsed);
      
      return parsed;
    } catch (error) {
      debugLogger.logError('intent_parsing', error, { userMessage });
      return null;
    }
  }

  private async generateResponse(prompt: string, type: string = 'general') {
    debugLogger.logOpenAI('SEND', prompt, { 
      model: 'gpt-4o-mini',
      type
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
    debugLogger.log('response_generation', 'Generating enhanced response with analytics', {
      userPrompt,
      intent,
      analyticsLength: analytics.length
    });
    
    const enhancedPrompt = `User asked: "${userPrompt}"\n\nDetected Intent: ${intent.query} query\n\nWallet Analytics:\n${analytics}\n\nPlease provide a natural, conversational response about this wallet data.`;

    return this.generateResponse(enhancedPrompt, 'enhanced_wallet');
  }

  async generateFallbackResponse(userPrompt: string) {
    debugLogger.log('response_generation', 'Generating fallback response', { userPrompt });
    
    const fallbackPrompt = `The user asked about wallet/portfolio information: "${userPrompt}"\n\nI attempted to fetch live wallet data but encountered an error. Please provide a helpful response about Solana wallets and portfolio management in general.`;

    return this.generateResponse(fallbackPrompt, 'fallback');
  }

  async generateActionResponse(userPrompt: string, intent: ParsedIntent) {
    debugLogger.log('response_generation', 'Generating action response', { 
      userPrompt, 
      action: intent.action 
    });
    
    const actionResponse = `I understand you want to perform a "${intent.action}" action. For now, I can only help with wallet balance queries. Action execution will be implemented in future updates.`;

    const prompt = `User requested: "${userPrompt}"\n\nProvide this response: ${actionResponse}\n\nThen offer to help with wallet balance queries instead.`;

    return this.generateResponse(prompt, 'action_acknowledgment');
  }

  async generateGeneralResponse(prompt: string) {
    debugLogger.log('response_generation', 'Generating general response', { prompt });
    return this.generateResponse(prompt, 'general');
  }
}
