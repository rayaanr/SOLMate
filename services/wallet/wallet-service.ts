import { fetchWalletData, isValidWalletAddress, sanitizeAddress, WalletData } from "./wallet-data";
import { analyzeWalletData, generateAnalyticsString, generateNftAnalyticsString, WalletAnalytics } from "./wallet-analytics";
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
    const resolvedAddress = await this.resolveWalletAddress(walletAddress);
    return fetchTransactionData(resolvedAddress, limit);
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
    return "kXB7FfzdrfZpAZEW3TZcp8a8CwQbsowa6BdfAHZ4gVs";
  }

  /**
   * Validate and resolve wallet address (handles .sol domains)
   */
  private async resolveWalletAddress(inputAddress?: string): Promise<string> {
    const address = inputAddress || this.getFallbackAddress();
    
    if (!address) {
      throw new Error("Wallet address is required");
    }

    // If it's already a valid wallet address, return as-is
    if (isValidWalletAddress(address) && !address.endsWith('.sol')) {
      return address;
    }

    // If it's a .sol domain, resolve it
    if (address.endsWith('.sol')) {
      try {
        const { Connection } = await import('@solana/web3.js');
        const { resolveRecipient } = await import('../domain/domain-resolution');
        
        const connection = new Connection(
          process.env.NEXT_PUBLIC_HELIUS_RPC_URL || 
          'https://api.mainnet-beta.solana.com'
        );
        const resolution = await resolveRecipient(address, connection);
        return resolution.address;
      } catch (error) {
        throw new Error(
          `Unable to resolve domain "${address}". Please check:
          • The domain spelling is correct
          • The domain is registered on a .sol domain service
          • Try using the actual wallet address instead
          
          Error: ${error instanceof Error ? error.message : 'Unknown error'}`
        );
      }
    }

    // Invalid format
    throw new Error(`Invalid wallet address format: ${sanitizeAddress(address)}`);
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
    const resolvedAddress = await this.resolveWalletAddress(walletAddress);
    const rawData = await this.fetchTransactionData(resolvedAddress, limit);
    const processedData = this.processTransactions(rawData, resolvedAddress);
    const analytics = this.analyzeTransactions(processedData);
    const analyticsString = this.generateTransactionAnalyticsString(analytics);

    return {
      rawData,
      processedData,
      analytics,
      analyticsString
    };
  }

  /**
   * Complete NFT analysis pipeline
   */
  async getNftAnalytics(userWallet?: string): Promise<{
    analyticsString: string;
    data: { nfts: WalletData['nfts'] };
    analytics: WalletAnalytics;
  }> {
    const data = await fetchWalletData(userWallet);
    const analytics = analyzeWalletData(data);
    const analyticsString = generateNftAnalyticsString(analytics);
    return {
      analyticsString,
      data: { nfts: data.nfts },
      analytics,
    };
  }
}

// Export types for convenience
export type { WalletData } from "./wallet-data";
export type { TokenData, WalletAnalytics } from "./wallet-analytics";
export type { TransactionData, ProcessedTransaction, TransactionAnalytics } from "./transaction-data";
