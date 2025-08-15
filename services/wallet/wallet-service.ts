import { fetchWalletData, isValidWalletAddress, sanitizeAddress, WalletData } from "./wallet-data";
import { analyzeWalletData, generateAnalyticsString, WalletAnalytics } from "./wallet-analytics";

/**
 * Main wallet service that orchestrates all wallet-related functionality
 */
export class WalletService {
  /**
   * Fetch wallet portfolio data
   */
  async fetchWalletData(walletAddress?: string): Promise<WalletData> {
    return fetchWalletData(walletAddress);
  }

  /**
   * Analyze wallet data and return analytics
   */
  analyzeWalletData(walletData: WalletData): WalletAnalytics {
    return analyzeWalletData(walletData);
  }

  /**
   * Generate human-readable analytics string
   */
  generateAnalyticsString(analytics: WalletAnalytics): string {
    return generateAnalyticsString(analytics);
  }

  /**
   * Validate wallet address format
   */
  isValidWalletAddress(address: string): boolean {
    return isValidWalletAddress(address);
  }

  /**
   * Sanitize address for safe logging
   */
  sanitizeAddress(address: string): string {
    return sanitizeAddress(address);
  }

  /**
   * Complete wallet analysis pipeline
   */
  async getWalletAnalytics(walletAddress?: string): Promise<{
    data: WalletData;
    analytics: WalletAnalytics;
    analyticsString: string;
  }> {
    const data = await this.fetchWalletData(walletAddress);
    const analytics = this.analyzeWalletData(data);
    const analyticsString = this.generateAnalyticsString(analytics);

    return {
      data,
      analytics,
      analyticsString
    };
  }
}

// Export types for convenience
export type { WalletData, WalletAnalytics } from "./wallet-data";
export type { TokenData } from "./wallet-analytics";
