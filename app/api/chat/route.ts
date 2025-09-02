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

    // Extract chat history if provided
    const chatHistory = body?.chatHistory || [];

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
      historyLength: chatHistory.length,
    });

    // Build context from chat history for better continuity
    const chatContext =
      chatHistory.length > 0
        ? `Previous conversation context:\n${chatHistory
            .map(
              (msg: any) =>
                `${msg.role === "user" ? "User" : "Assistant"}: ${msg.content}`
            )
            .join("\n")}\n\nCurrent question: ${prompt}`
        : prompt;

    // Parse user intent using AI with chat context
    // Pass the built chat context to help with multi-turn conversations
    const intent = await aiService.parseUserIntent(prompt, chatContext);

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
        const enhancedPrompt = `${
          chatHistory.length > 0
            ? `Previous conversation:\n${chatHistory
                .map(
                  (msg: any) =>
                    `${msg.role === "user" ? "User" : "Assistant"}: ${
                      msg.content
                    }`
                )
                .join("\n")}\n\n`
            : ""
        }User asked: "${prompt}"

Detected Intent: ${intent.query} query

Wallet Analytics:
${analyticsString}

Please provide a natural, conversational response about this wallet data. Consider the conversation context if provided.

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
        const enhancedPrompt = `${
          chatHistory.length > 0
            ? `Previous conversation:\n${chatHistory
                .map(
                  (msg: any) =>
                    `${msg.role === "user" ? "User" : "Assistant"}: ${
                      msg.content
                    }`
                )
                .join("\n")}\n\n`
            : ""
        }User asked: "${prompt}"

Detected Intent: ${intent.query} query

Transaction Analytics:
${analyticsString}

Please provide a natural, conversational response about this transaction history data. Consider the conversation context if provided.

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

        const enhancedPrompt = `${
          chatHistory.length > 0
            ? `Previous conversation:\n${chatHistory
                .map(
                  (msg: any) =>
                    `${msg.role === "user" ? "User" : "Assistant"}: ${
                      msg.content
                    }`
                )
                .join("\n")}\n\n`
            : ""
        }User asked: "${prompt}"

Detected Intent: ${intent.query} query

NFT Analytics:
${analyticsString}

Please provide a natural, conversational response about this NFT portfolio. Consider the conversation context if provided.

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
        const { data: marketData, cacheStatus } =
          await fetchSolanaMarketDataWithCache(50); // Get top 50 coins

        // Check if user is asking about a specific token
        const specificToken = intent.filters?.token_mint;

        if (specificToken) {
          // Find the specific token in the market data
          const requestedCoin = marketData.data.find(
            (coin) =>
              coin.symbol.toLowerCase() === specificToken.toLowerCase() ||
              coin.name.toLowerCase() === specificToken.toLowerCase() ||
              coin.id.toLowerCase() === specificToken.toLowerCase()
          );

          if (requestedCoin) {
            // Create a focused response for the specific token without showing table
            const enhancedPrompt = `${
              chatHistory.length > 0
                ? `Previous conversation:\n${chatHistory
                    .map(
                      (msg: any) =>
                        `${msg.role === "user" ? "User" : "Assistant"}: ${
                          msg.content
                        }`
                    )
                    .join("\n")}\n\n`
                : ""
            }User asked: "${prompt}"

Detected Intent: Specific ${specificToken.toUpperCase()} price query

Specific Token Data:
- Name: ${requestedCoin.name} (${requestedCoin.symbol.toUpperCase()})
- Current Price: $${requestedCoin.current_price.toLocaleString()}
- 24h Change: ${requestedCoin.price_change_percentage_24h.toFixed(2)}%
- Market Cap: $${(requestedCoin.market_cap / 1e9).toFixed(2)}B
- Market Cap Rank: #${requestedCoin.market_cap_rank}
- 24h Volume: $${(requestedCoin.total_volume / 1e6).toFixed(2)}M
- 24h High: $${requestedCoin.high_24h?.toLocaleString() || "N/A"}
- 24h Low: $${requestedCoin.low_24h?.toLocaleString() || "N/A"}

Please provide a direct, specific answer about ${
              requestedCoin.name
            }'s price and recent performance. Consider the conversation context if provided. Do NOT show a market table since the user asked about a specific token.

IMPORTANT: Give a conversational response with the exact price information. Do not end with any data reference tags.`;

            const result = await aiService.generateResponse(
              enhancedPrompt,
              "specific_token_price"
            );
            return result.toUIMessageStreamResponse();
          } else {
            // Token not found in Solana ecosystem data
            const enhancedPrompt = `${
              chatHistory.length > 0
                ? `Previous conversation:\n${chatHistory
                    .map(
                      (msg: any) =>
                        `${msg.role === "user" ? "User" : "Assistant"}: ${
                          msg.content
                        }`
                    )
                    .join("\n")}\n\n`
                : ""
            }User asked: "${prompt}"

Detected Intent: Specific ${specificToken.toUpperCase()} price query

The requested token "${specificToken}" was not found in the top 50 Solana ecosystem tokens. This could mean:
1. It's not in the top 50 by market cap
2. It might not be a Solana-based token
3. The symbol might be different

Available major tokens in our data include: ${marketData.data
              .slice(0, 10)
              .map((coin) => coin.symbol.toUpperCase())
              .join(", ")}

Please provide a helpful response explaining that the specific token wasn't found and suggest alternatives or ask for clarification. Consider the conversation context if provided. Do not show a market table.`;

            const result = await aiService.generateResponse(
              enhancedPrompt,
              "token_not_found"
            );
            return result.toUIMessageStreamResponse();
          }
        } else {
          // General market query - show market table
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

          const enhancedPrompt = `${
            chatHistory.length > 0
              ? `Previous conversation:\n${chatHistory
                  .map(
                    (msg: any) =>
                      `${msg.role === "user" ? "User" : "Assistant"}: ${
                        msg.content
                      }`
                  )
                  .join("\n")}\n\n`
              : ""
          }User asked: "${prompt}"

Detected Intent: ${intent.query} query (general market overview)

Market Analytics:
${marketData.analytics.marketSummary}

Total Market Cap: $${(marketData.analytics.totalMarketCap / 1e9).toFixed(2)}B
Total Volume (24h): $${(marketData.analytics.totalVolume / 1e9).toFixed(2)}B
Average Change (24h): ${marketData.analytics.averageChange24h.toFixed(2)}%

Top Gainers: ${marketData.analytics.topGainers
            .slice(0, 3)
            .map(
              (coin) =>
                `${coin.name} (+${coin.price_change_percentage_24h.toFixed(
                  2
                )}%)`
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

Please provide a natural, conversational response about this Solana ecosystem market data. Consider the conversation context if provided.

IMPORTANT: End your response with this exact market data reference:
[MARKET_DATA_ID]${dataId}[/MARKET_DATA_ID]`;

          const result = await aiService.generateResponse(
            enhancedPrompt,
            "enhanced_market_with_data"
          );
          return result.toUIMessageStreamResponse();
        }
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
      // Include chat context in general responses too
      const contextualPrompt =
        chatHistory.length > 0
          ? `Previous conversation:\n${chatHistory
              .map(
                (msg: any) =>
                  `${msg.role === "user" ? "User" : "Assistant"}: ${
                    msg.content
                  }`
              )
              .join("\n")}\n\nCurrent question: ${prompt}`
          : prompt;

      const result = await aiService.generateGeneralResponse(contextualPrompt);
      return result.toUIMessageStreamResponse();
    }
  } catch (error) {
    console.error("chat_route", error);
    return new Response("Failed to process request", { status: 500 });
  }
}
