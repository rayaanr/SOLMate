import { validateConfig } from "@/lib/config";
import { AIService } from "@/services/ai/ai-service";
import { WalletService } from "@/services/wallet/wallet-service";
import { fetchSolanaMarketData } from "@/src/services/market-data";

// Validate environment variables on startup
validateConfig();

// Initialize services
const aiService = new AIService();
const walletService = new WalletService();

export async function POST(req: Request) {
  try {
    const { prompt, userWallet } = await req.json();

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
        const { analyticsString, data } = await walletService.getWalletAnalytics(
          userWallet
        );

        // Generate enhanced response with embedded portfolio data
        const enhancedPrompt = `User asked: "${prompt}"

Detected Intent: ${intent.query} query

Wallet Analytics:
${analyticsString}

Please provide a natural, conversational response about this wallet data.

IMPORTANT: End your response with this exact portfolio data:
[PORTFOLIO_DATA]${JSON.stringify({
  tokens: data.tokens,
  native_balance: data.native_balance
})}[/PORTFOLIO_DATA]`;

        const result = await aiService.generateResponse(enhancedPrompt, "enhanced_wallet_with_data");

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
      (['transactions', 'history', 'activity', 'txn_history'].includes(intent.query || ''))
    ) {
      try {
        // Fetch transaction analytics for the connected user's wallet
        const { analyticsString, processedData, analytics } = await walletService.getTransactionAnalytics(
          userWallet,
          25 // Get last 25 transactions
        );

        // Generate enhanced response with embedded transaction data
        const enhancedPrompt = `User asked: "${prompt}"

Detected Intent: ${intent.query} query

Transaction Analytics:
${analyticsString}

Please provide a natural, conversational response about this transaction history data.

IMPORTANT: End your response with this exact transaction data:
[TRANSACTION_DATA]${JSON.stringify({
  transactions: processedData.slice(0, 15), // Limit to 15 for display
  analytics: {
    totalTransactions: analytics.totalTransactions,
    incomingTransactions: analytics.incomingTransactions,
    outgoingTransactions: analytics.outgoingTransactions,
    swapTransactions: analytics.swapTransactions,
    totalFeesSpent: analytics.totalFeesSpent
  }
})}[/TRANSACTION_DATA]`;

        const result = await aiService.generateResponse(enhancedPrompt, "enhanced_transaction_with_data");

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
    else if (
      intent &&
      intent.type === "query" &&
      intent.query === "nfts"
    ) {
      try {
        const { analyticsString, data, analytics } = await walletService.getNftAnalytics(userWallet);

        const enhancedPrompt = `User asked: "${prompt}"

Detected Intent: ${intent.query} query

NFT Analytics:
${analyticsString}

Please provide a natural, conversational response about this NFT portfolio.

IMPORTANT: End your response with this exact NFT data:
[NFT_DATA]${JSON.stringify({
  nfts: data.nfts.slice(0, 60), // limit to 60 for UI performance
  analytics: {
    totalNfts: analytics.nftCount,
    topCollections: (analytics.nftCollections || []).slice(0, 5),
    compressedShare: analytics.compressedNftRatio ?? 0
  }
})}[/NFT_DATA]`;

        const result = await aiService.generateResponse(enhancedPrompt, "enhanced_wallet_with_data");
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
      (['market', 'prices', 'trends', 'gainers', 'losers'].includes(intent.query || ''))
    ) {
      try {
        const marketData = await fetchSolanaMarketData(50); // Get top 50 coins

        const enhancedPrompt = `User asked: "${prompt}"

Detected Intent: ${intent.query} query

Market Analytics:
${marketData.analytics.marketSummary}

Total Market Cap: $${(marketData.analytics.totalMarketCap / 1e9).toFixed(2)}B
Total Volume (24h): $${(marketData.analytics.totalVolume / 1e9).toFixed(2)}B
Average Change (24h): ${marketData.analytics.averageChange24h.toFixed(2)}%

Top Gainers: ${marketData.analytics.topGainers.slice(0, 3).map(coin => 
  `${coin.name} (+${coin.price_change_percentage_24h.toFixed(2)}%)`
).join(', ')}

Top Losers: ${marketData.analytics.topLosers.slice(0, 3).map(coin => 
  `${coin.name} (${coin.price_change_percentage_24h.toFixed(2)}%)`
).join(', ')}

Please provide a natural, conversational response about this Solana ecosystem market data.

IMPORTANT: End your response with this exact market data:
[MARKET_DATA]${JSON.stringify({
  coins: marketData.data.slice(0, 25), // limit to 25 for UI performance
  analytics: {
    totalMarketCap: marketData.analytics.totalMarketCap,
    totalVolume: marketData.analytics.totalVolume,
    averageChange24h: marketData.analytics.averageChange24h,
    topGainers: marketData.analytics.topGainers.slice(0, 5),
    topLosers: marketData.analytics.topLosers.slice(0, 5),
    marketSummary: marketData.analytics.marketSummary
  }
})}[/MARKET_DATA]`;

        const result = await aiService.generateResponse(enhancedPrompt, "enhanced_market_with_data");
        return result.toUIMessageStreamResponse();
      } catch (apiError) {
        console.error("market_query_error", apiError, { prompt, intent });
        const result = await aiService.generateFallbackResponse(prompt);
        return result.toUIMessageStreamResponse();
      }
    }
    // Handle transfer action intents
    else if (
      intent &&
      intent.type === "action" &&
      intent.action === "transfer"
    ) {
      try {
        const result = await aiService.prepareTransactionIntent(
          prompt,
          intent,
          userWallet
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
          userWallet
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
