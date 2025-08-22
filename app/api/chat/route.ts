import { validateConfig } from "@/lib/config";
import { AIService } from "@/services/ai/ai-service";
import { WalletService } from "@/services/wallet/wallet-service";
import { fetchSolanaMarketDataWithCache } from "@/services/market/market-data";

/**
 * Extracts the prompt from AI SDK messages array format
 * @param messages - Array of message objects from AI SDK
 * @returns The text content of the last user message, or undefined if not found
 */
function extractPromptFromMessages(messages: any[]): string | undefined {
  if (!Array.isArray(messages)) return undefined;
  // Find last user message
  const lastUser = [...messages].reverse().find((m) => m?.role === "user");
  if (!lastUser) return undefined;

  // Try new shapes
  // Shape A: parts: [{ type: 'text', text: '...' }, ...]
  if (Array.isArray(lastUser.parts)) {
    return lastUser.parts
      .filter((p: any) => p?.type === "text" && typeof p?.text === "string")
      .map((p: any) => p.text)
      .join(" ")
      .trim();
  }

  // Shape B: content: [{ type: 'text', text: '...' } | { type: 'input_text', text: '...' }, ...]
  if (Array.isArray(lastUser.content)) {
    return lastUser.content
      .map((c: any) => {
        if (typeof c === "string") return c;
        if (c?.type && typeof c?.text === "string") return c.text;
        if (typeof c?.content === "string") return c.content;
        return "";
      })
      .join(" ")
      .trim();
  }

  // Shape C: simple { content: '...' }
  if (typeof lastUser.content === "string") return lastUser.content.trim();

  return undefined;
}

// Global type declaration for temporary data store
declare global {
  var tempDataStore: Map<string, any> | undefined;
}

// Validate environment variables on startup
validateConfig();

// Initialize services
const aiService = new AIService();
const walletService = new WalletService();

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // Extract wallet from various possible locations
    const finalWallet = body?.userWallet ?? body?.data?.userWallet ?? undefined;

    // Extract prompt from either legacy format or AI SDK messages format
    let { prompt } = body;
    if (!prompt && body.messages) {
      prompt = extractPromptFromMessages(body.messages);
    }

    // Validate we have a prompt
    if (!prompt || typeof prompt !== "string" || !prompt.trim()) {
      return new Response(
        JSON.stringify({ error: "Invalid request: missing prompt/messages" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Log wallet status for debugging
    console.log("🔗 Wallet Info:", {
      finalWallet,
      isConnected: !!finalWallet,
    });

    // Parse user intent using AI
    const intent = await aiService.parseUserIntent(prompt);

    // Handle wallet balance/portfolio queries
    if (
      intent &&
      intent.type === "query" &&
      (intent.query === "balances" || intent.query === "portfolio")
    ) {
      try {
        // Fetch wallet analytics for the connected user's wallet
        const { analyticsString, data } =
          await walletService.getWalletAnalytics(finalWallet);

        // Store portfolio data in memory with unique ID for fast retrieval
        const dataId = `portfolio_${Date.now()}_${Math.random()
          .toString(36)
          .substr(2, 9)}`;

        // Store the data temporarily (in production, use Redis or similar)
        global.tempDataStore = global.tempDataStore || new Map();
        global.tempDataStore.set(dataId, {
          tokens: data.tokens,
          native_balance: data.native_balance,
        });

        // Auto-cleanup after 5 minutes
        setTimeout(() => global.tempDataStore?.delete(dataId), 5 * 60 * 1000);

        // Generate enhanced response with data reference instead of embedded JSON
        const enhancedPrompt = `User asked: "${prompt}"

Detected Intent: ${intent.query} query

Wallet Analytics:
${analyticsString}

Please provide a natural, conversational response about this wallet data.

IMPORTANT: End your response with this exact portfolio data reference:
[PORTFOLIO_DATA_ID]${dataId}[/PORTFOLIO_DATA_ID]`;

        const result = await aiService.generateResponse(
          enhancedPrompt,
          "enhanced_wallet_with_data"
        );

        return result.toUIMessageStreamResponse();
      } catch (apiError) {
        console.error("wallet_query_error", apiError, {
          prompt,
          intent,
        });

        // Fallback response
        const result = await aiService.generateFallbackResponse(prompt);

        return result.toUIMessageStreamResponse();
      }
    }
    // Handle transaction history queries
    else if (
      intent &&
      intent.type === "query" &&
      ["transactions", "history", "activity", "txn_history"].includes(
        intent.query || ""
      )
    ) {
      try {
        // Fetch transaction analytics for the connected user's wallet
        const { analyticsString, processedData, analytics } =
          await walletService.getTransactionAnalytics(
            finalWallet,
            25 // Get last 25 transactions
          );

        // Store data in memory with unique ID for fast retrieval
        const dataId = `txn_${Date.now()}_${Math.random()
          .toString(36)
          .substr(2, 9)}`;

        // Store the data temporarily (in production, use Redis or similar)
        global.tempDataStore = global.tempDataStore || new Map();
        global.tempDataStore.set(dataId, {
          transactions: processedData.slice(0, 15), // Limit to 15 for display
          analytics: {
            totalTransactions: analytics.totalTransactions,
            incomingTransactions: analytics.incomingTransactions,
            outgoingTransactions: analytics.outgoingTransactions,
            swapTransactions: analytics.swapTransactions,
            totalFeesSpent: analytics.totalFeesSpent,
          },
        });

        // Auto-cleanup after 5 minutes
        setTimeout(() => global.tempDataStore?.delete(dataId), 5 * 60 * 1000);

        // Generate enhanced response with data reference instead of embedded JSON
        const enhancedPrompt = `User asked: "${prompt}"

Detected Intent: ${intent.query} query

Transaction Analytics:
${analyticsString}

Please provide a natural, conversational response about this transaction history data.

IMPORTANT: End your response with this exact transaction data reference:
[TRANSACTION_DATA_ID]${dataId}[/TRANSACTION_DATA_ID]`;

        const result = await aiService.generateResponse(
          enhancedPrompt,
          "enhanced_transaction_with_data"
        );

        return result.toUIMessageStreamResponse();
      } catch (apiError) {
        console.error("transaction_query_error", apiError, {
          prompt,
          intent,
        });

        // Fallback response
        const result = await aiService.generateFallbackResponse(prompt);

        return result.toUIMessageStreamResponse();
      }
    }
    // Handle NFT queries
    else if (intent && intent.type === "query" && intent.query === "nfts") {
      try {
        const { analyticsString, data, analytics } =
          await walletService.getNftAnalytics(finalWallet);

        // Store NFT data in memory with unique ID for fast retrieval
        const dataId = `nft_${Date.now()}_${Math.random()
          .toString(36)
          .substr(2, 9)}`;

        // Store the data temporarily (in production, use Redis or similar)
        global.tempDataStore = global.tempDataStore || new Map();
        global.tempDataStore.set(dataId, {
          nfts: data.nfts.slice(0, 60), // limit to 60 for UI performance
          analytics: {
            totalNfts: analytics.nftCount,
            topCollections: (analytics.nftCollections || []).slice(0, 5),
            compressedShare: analytics.compressedNftRatio ?? 0,
          },
        });

        // Auto-cleanup after 5 minutes
        setTimeout(() => global.tempDataStore?.delete(dataId), 5 * 60 * 1000);

        const enhancedPrompt = `User asked: "${prompt}"

Detected Intent: ${intent.query} query

NFT Analytics:
${analyticsString}

Please provide a natural, conversational response about this NFT portfolio.

IMPORTANT: End your response with this exact NFT data reference:
[NFT_DATA_ID]${dataId}[/NFT_DATA_ID]`;

        const result = await aiService.generateResponse(
          enhancedPrompt,
          "enhanced_wallet_with_data"
        );
        return result.toUIMessageStreamResponse();
      } catch (apiError) {
        console.error("nft_query_error", apiError, { prompt, intent });
        const result = await aiService.generateFallbackResponse(prompt);
        return result.toUIMessageStreamResponse();
      }
    }
    // Handle market data queries
    else if (
      intent &&
      intent.type === "query" &&
      ["market", "prices", "trends", "gainers", "losers"].includes(
        intent.query || ""
      )
    ) {
      try {
        const { data: marketData, cacheStatus } = await fetchSolanaMarketDataWithCache(50); // Get top 50 coins

        // Store market data in memory with unique ID for fast retrieval
        const dataId = `market_${Date.now()}_${Math.random()
          .toString(36)
          .substr(2, 9)}`;

        // Store the data temporarily (in production, use Redis or similar)
        global.tempDataStore = global.tempDataStore || new Map();
        global.tempDataStore.set(dataId, {
          coins: marketData.data.slice(0, 25), // limit to 25 for UI performance
          analytics: {
            totalMarketCap: marketData.analytics.totalMarketCap,
            totalVolume: marketData.analytics.totalVolume,
            averageChange24h: marketData.analytics.averageChange24h,
            topGainers: marketData.analytics.topGainers.slice(0, 5),
            topLosers: marketData.analytics.topLosers.slice(0, 5),
            marketSummary: marketData.analytics.marketSummary,
          },
        });

        // Auto-cleanup after 5 minutes
        setTimeout(() => global.tempDataStore?.delete(dataId), 5 * 60 * 1000);

        const enhancedPrompt = `User asked: "${prompt}"

Detected Intent: ${intent.query} query

Market Analytics:
${marketData.analytics.marketSummary}

Total Market Cap: $${(marketData.analytics.totalMarketCap / 1e9).toFixed(2)}B
Total Volume (24h): $${(marketData.analytics.totalVolume / 1e9).toFixed(2)}B
Average Change (24h): ${marketData.analytics.averageChange24h.toFixed(2)}%

Top Gainers: ${marketData.analytics.topGainers
          .slice(0, 3)
          .map(
            (coin) =>
              `${coin.name} (+${coin.price_change_percentage_24h.toFixed(2)}%)`
          )
          .join(", ")}

Top Losers: ${marketData.analytics.topLosers
          .slice(0, 3)
          .map(
            (coin) =>
              `${coin.name} (${coin.price_change_percentage_24h.toFixed(2)}%)`
          )
          .join(", ")}

Cache Status: ${cacheStatus}

Please provide a natural, conversational response about this Solana ecosystem market data.

IMPORTANT: End your response with this exact market data reference:
[MARKET_DATA_ID]${dataId}[/MARKET_DATA_ID]`;

        const result = await aiService.generateResponse(
          enhancedPrompt,
          "enhanced_market_with_data"
        );
        return result.toUIMessageStreamResponse();
      } catch (apiError) {
        console.error("market_query_error", apiError, { prompt, intent });
        const result = await aiService.generateFallbackResponse(prompt);
        return result.toUIMessageStreamResponse();
      }
    }
    // Handle transfer and deposit action intents
    else if (
      intent &&
      intent.type === "action" &&
      (intent.action === "transfer" || intent.action === "deposit")
    ) {
      try {
        const result = await aiService.prepareTransactionIntent(
          prompt,
          intent,
          finalWallet
        );

        // All responses are now streaming, including transactions
        if (
          result &&
          typeof result === "object" &&
          "toUIMessageStreamResponse" in result
        ) {
          return (
            result as { toUIMessageStreamResponse: () => Response }
          ).toUIMessageStreamResponse();
        }

        // Fallback
        throw new Error(
          "Unexpected response format from prepareTransactionIntent"
        );
      } catch (error) {
        console.error("transaction_preparation_error", {
          error: (error as Error)?.message ?? String(error),
          intent: intent
            ? { type: intent.type, action: intent.action ?? null }
            : null,
        });

        // Fallback to general action response
        const result = await aiService.generateActionResponse(prompt, intent);
        return result.toUIMessageStreamResponse();
      }
    }
    // Handle swap action intents
    else if (intent && intent.type === "action" && intent.action === "swap") {
      try {
        const result = await aiService.prepareSwapIntent(
          prompt,
          intent,
          finalWallet
        );

        // All responses are now streaming, including swaps
        if (
          result &&
          typeof result === "object" &&
          "toUIMessageStreamResponse" in result
        ) {
          return (
            result as { toUIMessageStreamResponse: () => Response }
          ).toUIMessageStreamResponse();
        }

        // Fallback
        throw new Error("Unexpected response format from prepareSwapIntent");
      } catch (error) {
        console.error("swap_preparation_error", error, {
          prompt,
          intent,
        });

        // Fallback to general action response
        const result = await aiService.generateActionResponse(prompt, intent);
        return result.toUIMessageStreamResponse();
      }
    }
    // Handle other action intents
    else if (intent && intent.type === "action") {
      const result = await aiService.generateActionResponse(prompt, intent);
      return result.toUIMessageStreamResponse();
    }
    // Handle general queries
    else {
      const result = await aiService.generateGeneralResponse(prompt);
      return result.toUIMessageStreamResponse();
    }
  } catch (error) {
    console.error("chat_route", error);
    return new Response("Failed to process request", { status: 500 });
  }
}
