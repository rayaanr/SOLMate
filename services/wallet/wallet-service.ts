import { fetchWalletData, isValidWalletAddress, sanitizeAddress, WalletData } from "./wallet-data";
import { analyzeWalletData, generateAnalyticsString, WalletAnalytics } from "./wallet-analytics";
import { 
  fetchTransactionData, 
  processTransactionData, 
  analyzeTransactions,
  generateTransactionAnalyticsString,
  TransactionData, 
  ProcessedTransaction,
  TransactionAnalytics
} from "./transaction-data";

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

  /**
   * Fetch transaction data
   */
  async fetchTransactionData(walletAddress?: string, limit: number = 25): Promise<TransactionData[]> {
    const address = walletAddress || this.getFallbackAddress();
    return fetchTransactionData(address, limit);
  }

  /**
   * Process raw transaction data into display-friendly format
   */
  processTransactions(rawTransactions: TransactionData[], userWallet: string): ProcessedTransaction[] {
    return processTransactionData(rawTransactions, userWallet);
  }

  /**
   * Analyze transactions to generate insights
   */
  analyzeTransactions(transactions: ProcessedTransaction[]): TransactionAnalytics {
    return analyzeTransactions(transactions);
  }

  /**
   * Generate transaction analytics string for AI
   */
  generateTransactionAnalyticsString(analytics: TransactionAnalytics): string {
    return generateTransactionAnalyticsString(analytics);
  }

  /**
   * Get fallback wallet address if none provided
   */
  private getFallbackAddress(): string {
    return process.env.NEXT_PUBLIC_DEFAULT_WALLET_ADDRESS || '';
  }

  /**
   * Complete transaction analysis pipeline
   */
  async getTransactionAnalytics(walletAddress?: string, limit: number = 25): Promise<{
    rawData: TransactionData[];
    processedData: ProcessedTransaction[];
    analytics: TransactionAnalytics;
    analyticsString: string;
  }> {
    const address = walletAddress || this.getFallbackAddress();
    const rawData = await this.fetchTransactionData(address, limit);
    const processedData = this.processTransactions(rawData, address);
    const analytics = this.analyzeTransactions(processedData);
    const analyticsString = this.generateTransactionAnalyticsString(analytics);

    return {
      rawData,
      processedData,
      analytics,
      analyticsString
    };
  }
}

// Export types for convenience
export type { WalletData } from "./wallet-data";
export type { TokenData, WalletAnalytics } from "./wallet-analytics";
export type { TransactionData, ProcessedTransaction, TransactionAnalytics } from "./transaction-data";
