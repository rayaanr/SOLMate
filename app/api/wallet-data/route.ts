import { validateConfig } from "@/lib/config";
import { WalletService } from "@/services/wallet/wallet-service";

// Validate environment variables on startup
validateConfig();

// Initialize services
const walletService = new WalletService();

export async function GET(req: Request) {
  try {
    // Parse query parameters
    const { searchParams } = new URL(req.url);
    const address = searchParams.get("address") || undefined;

    // Validate address if provided
    if (address && !walletService.isValidWalletAddress(address)) {
      return new Response(
        JSON.stringify({
          error: "Invalid wallet address format",
          address: walletService.sanitizeAddress(address),
        }),
        {
          status: 400,
          headers: {
            "content-type": "application/json",
            "cache-control": "no-store",
          },
        }
      );
    }

    // Fetch wallet analytics (this uses the cached fetchWalletData internally)
    const { data } = await walletService.getWalletAnalytics(address);

    // Build response (excluding analyticsString which is only for AI)
    const response = {
      walletAddress: address || "default",
      native_balance: data.native_balance,
      tokens: data.tokens,
      updatedAt: new Date().toISOString(),
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: {
        "content-type": "application/json",
        "cache-control": "no-store",
      },
    });
  } catch (error) {
    console.error("wallet_data_route_error", error);

    return new Response(
      JSON.stringify({
        error: "Failed to fetch wallet data",
        message: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: {
          "content-type": "application/json",
          "cache-control": "no-store",
        },
      }
    );
  }
}
