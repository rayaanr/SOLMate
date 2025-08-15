import { validateConfig } from "@/lib/config";
import { AIService } from "@/services/ai/ai-service";
import { WalletService } from "@/services/wallet/wallet-service";

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
        const { analyticsString } = await walletService.getWalletAnalytics(userWallet);

        // Generate enhanced response
        const result = await aiService.generateEnhancedResponse(
          prompt,
          intent,
          analyticsString
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
    console.error("chat_route", error, { prompt: req.body });
    return new Response("Failed to process request", { status: 500 });
  }
}
