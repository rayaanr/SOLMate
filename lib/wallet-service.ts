import { config } from "./config";
import { TokenData, WalletData, WalletAnalytics } from "./types";
import { debugLogger } from "./debug";

export class WalletService {
  private readonly apiKey = config.moralis.apiKey!;
  private readonly baseUrl = config.moralis.baseUrl;

  async fetchWalletData(walletAddress?: string): Promise<WalletData> {
    const address = walletAddress || config.wallet.defaultAddress;

    if (!address) {
      const error = new Error("Wallet address is required");
      debugLogger.logError('wallet_fetch', error);
      throw error;
    }

    try {
      const url = `${this.baseUrl}/account/mainnet/${address}/portfolio?nftMetadata=true&mediaItems=false&excludeSpam=false`;
      
      debugLogger.log('wallet_fetch', 'Fetching wallet data from Moralis API', {
        address,
        url: url.replace(this.apiKey, 'API_KEY_HIDDEN')
      });

      const response = await fetch(url, {
        method: "GET",
        headers: {
          accept: "application/json",
          "X-API-Key": this.apiKey,
        },
      });

      debugLogger.log('wallet_fetch', 'Moralis API response received', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok
      });

      if (!response.ok) {
        const error = new Error(`HTTP error! status: ${response.status}`);
        debugLogger.logError('wallet_fetch', error, { 
          status: response.status, 
          statusText: response.statusText 
        });
        throw error;
      }

      const data = await response.json();
      
      debugLogger.log('wallet_fetch', 'Successfully fetched wallet data', {
        tokensCount: data.tokens?.length || 0,
        nftsCount: data.nfts?.length || 0,
        hasNativeBalance: !!data.native_balance
      });
      
      return data;
    } catch (error) {
      debugLogger.logError('wallet_fetch', error, { address });
      throw error;
    }
  }

  analyzeWalletData(walletData: WalletData): WalletAnalytics {
    try {
      debugLogger.log('wallet_analysis', 'Starting wallet data analysis');
      
      const { tokens, nfts, native_balance } = walletData;

      // Calculate total USD value
      let totalUsdValue = 0;
      let tokenCount = 0;
      const nftCount = nfts?.length || 0;

      // Analyze native SOL balance
      const solBalance = native_balance ? parseFloat(native_balance.solana) : 0;
      const solUsdValue = native_balance
        ? parseFloat(native_balance.usd_value || "0")
        : 0;
      totalUsdValue += solUsdValue;

      debugLogger.log('wallet_analysis', 'SOL balance calculated', {
        solBalance,
        solUsdValue
      });

      // Analyze tokens
      const tokenAnalysis: TokenData[] =
        tokens?.map((token: any) => {
          const usdValue = parseFloat(token.usd_value || "0");
          totalUsdValue += usdValue;
          tokenCount++;

          return {
            symbol: token.symbol,
            name: token.name,
            balance: token.amount_raw,
            usdValue: usdValue,
            percentage: 0, // Will calculate after getting total
          };
        }) || [];

      // Calculate percentages
      tokenAnalysis.forEach((token) => {
        token.percentage =
          totalUsdValue > 0 ? (token.usdValue / totalUsdValue) * 100 : 0;
      });

      // Sort tokens by USD value
      const topTokens = tokenAnalysis.sort((a, b) => b.usdValue - a.usdValue);

      // Determine diversification and concentration
      const diversificationScore: "Low" | "Medium" | "High" =
        tokenCount > 10 ? "High" : tokenCount > 5 ? "Medium" : "Low";

      const topTokenPercentage = topTokens[0]?.percentage || 0;
      const concentrationRisk: "Low" | "Moderate" | "High" =
        topTokenPercentage > 70
          ? "High"
          : topTokenPercentage > 50
          ? "Moderate"
          : "Low";

      const analytics = {
        totalUsdValue,
        solBalance,
        solUsdValue,
        tokenCount,
        nftCount,
        topTokens,
        diversificationScore,
        concentrationRisk,
      };
      
      debugLogger.log('wallet_analysis', 'Wallet analysis completed', {
        totalUsdValue,
        tokenCount,
        nftCount,
        diversificationScore,
        concentrationRisk,
        topTokensCount: topTokens.length
      });
      
      return analytics;
    } catch (error) {
      debugLogger.logError('wallet_analysis', error);
      throw new Error("Unable to analyze wallet data");
    }
  }

  generateAnalyticsString(analytics: WalletAnalytics): string {
    const {
      totalUsdValue,
      solBalance,
      solUsdValue,
      tokenCount,
      nftCount,
      topTokens,
      diversificationScore,
      concentrationRisk,
    } = analytics;

    let analyticsString = `🔍 **Wallet Portfolio Analytics**\n\n`;
    analyticsString += `📊 **Portfolio Overview:**\n`;
    analyticsString += `• Total Portfolio Value: $${totalUsdValue.toFixed(
      2
    )} USD\n`;
    analyticsString += `• Native SOL Balance: ${solBalance.toFixed(
      4
    )} SOL ($${solUsdValue.toFixed(2)})\n`;
    analyticsString += `• Token Holdings: ${tokenCount} different tokens\n`;
    analyticsString += `• NFT Collection: ${nftCount} NFTs\n\n`;

    if (topTokens.length > 0) {
      analyticsString += `💰 **Top Token Holdings:**\n`;
      topTokens.slice(0, 5).forEach((token, index) => {
        analyticsString += `${index + 1}. ${token.symbol} (${token.name})\n`;
        analyticsString += `   Value: $${token.usdValue.toFixed(
          2
        )} (${token.percentage.toFixed(1)}% of portfolio)\n`;
      });
      analyticsString += `\n`;
    }

    // Portfolio analysis
    if (topTokens.length > 0) {
      const topTokenPercentage = topTokens[0].percentage;
      analyticsString += `📈 **Portfolio Analysis:**\n`;

      if (concentrationRisk === "High") {
        analyticsString += `⚠️ High concentration risk: ${
          topTokens[0].symbol
        } represents ${topTokenPercentage.toFixed(1)}% of your portfolio\n`;
      } else if (concentrationRisk === "Moderate") {
        analyticsString += `⚡ Moderate concentration: ${
          topTokens[0].symbol
        } is your largest holding at ${topTokenPercentage.toFixed(1)}%\n`;
      } else {
        analyticsString += `✅ Well diversified portfolio with balanced token allocation\n`;
      }

      analyticsString += `• Portfolio Diversification Score: ${diversificationScore}\n`;
    }

    if (nftCount > 0) {
      analyticsString += `🎨 **NFT Collection:** You hold ${nftCount} NFTs in your wallet\n`;
    }

    return analyticsString;
  }

  async getWalletAnalytics(walletAddress?: string): Promise<string> {
    const walletData = await this.fetchWalletData(walletAddress);
    const analytics = this.analyzeWalletData(walletData);
    return this.generateAnalyticsString(analytics);
  }
}
