import { validateConfig } from "@/lib/config";
import { AIService } from "@/lib/ai-service";
import { WalletService } from "@/lib/wallet-service";
import { debugLogger } from "@/lib/debug";

// Validate environment variables on startup
validateConfig();

// Initialize services
const aiService = new AIService();
const walletService = new WalletService();

export async function POST(req: Request) {
  try {
    const { prompt, userWallet } = await req.json();

    debugLogger.log("chat_request", "Received chat request", {
      prompt,
      userWallet,
    });

    // Parse user intent using AI
    const intent = await aiService.parseUserIntent(prompt);

    debugLogger.log("intent_result", "Intent parsing completed", {
      intent,
      hasIntent: !!intent,
      intentType: intent?.type,
      queryType: intent?.query,
      actionType: intent?.action,
    });

    // Handle wallet balance/portfolio queries
    if (
      intent &&
      intent.type === "query" &&
      (intent.query === "balances" || intent.query === "portfolio")
    ) {
      debugLogger.log("route_decision", "Processing wallet query", {
        queryType: intent.query,
      });

      try {
        // Fetch wallet analytics for the connected user's wallet
        const analytics = await walletService.getWalletAnalytics(userWallet);

        debugLogger.log("analytics_generated", "Wallet analytics generated", {
          analyticsLength: analytics.length,
          walletAddress: userWallet
        });

        // Generate enhanced response
        const result = await aiService.generateEnhancedResponse(
          prompt,
          intent,
          analytics
        );

        debugLogger.log(
          "response_ready",
          "Enhanced response generated successfully"
        );
        return result.toUIMessageStreamResponse();
      } catch (apiError) {
        debugLogger.logError("wallet_query_error", apiError, {
          prompt,
          intent,
        });

        // Fallback response
        const result = await aiService.generateFallbackResponse(prompt);
        debugLogger.log(
          "fallback_response",
          "Using fallback response due to wallet error"
        );
        return result.toUIMessageStreamResponse();
      }
    }
    // Handle transfer action intents
    else if (
      intent &&
      intent.type === "action" &&
      intent.action === "transfer"
    ) {
      debugLogger.log("route_decision", "Processing transfer action intent", {
        actionType: intent.action,
        params: intent.params,
      });

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
          debugLogger.log("response_ready", "Transfer response generated");
          return (result as { toUIMessageStreamResponse: () => Response }).toUIMessageStreamResponse();
        }

        // Fallback
        throw new Error(
          "Unexpected response format from prepareTransactionIntent"
        );
      } catch (error) {
        debugLogger.logError("transfer_preparation_error", error, {
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
      debugLogger.log("route_decision", "Processing action intent", {
        actionType: intent.action,
      });

      const result = await aiService.generateActionResponse(prompt, intent);
      debugLogger.log("response_ready", "Action response generated");
      return result.toUIMessageStreamResponse();
    }
    // Handle general queries
    else {
      debugLogger.log(
        "route_decision",
        "Processing general query (no intent or unrecognized)"
      );

      const result = await aiService.generateGeneralResponse(prompt);
      debugLogger.log("response_ready", "General response generated");
      return result.toUIMessageStreamResponse();
    }
  } catch (error) {
    debugLogger.logError("chat_route", error, { prompt: req.body });
    return new Response("Failed to process request", { status: 500 });
  }
}
