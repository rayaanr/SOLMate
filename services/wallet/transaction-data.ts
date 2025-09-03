import { config } from "@/lib/config";
import { Connection } from "@solana/web3.js";
import { MINT_TO_SYMBOL_MAP } from "@/data/tokens";
import { resolveRecipient, isValidRecipient } from "../domain/domain-resolution";

// Transaction data structure based on Helius API response
export interface TransactionData {
  signature: string;
  description: string;
  type: string;
  source: string;
  fee: number;
  feePayer: string;
  slot: number;
  timestamp: number;
  tokenTransfers: Array<{
    fromTokenAccount: string;
    toTokenAccount: string;
    fromUserAccount: string;
    toUserAccount: string;
    tokenAmount: number;
    mint: string;
    tokenStandard: string;
  }>;
  nativeTransfers: Array<{
    fromUserAccount: string;
    toUserAccount: string;
    amount: number;
  }>;
  accountData: Array<{
    account: string;
    nativeBalanceChange: number;
    tokenBalanceChanges: Array<{
      userAccount: string;
      tokenAccount: string;
      rawTokenAmount: {
        tokenAmount: string;
        decimals: number;
      };
      mint: string;
    }>;
  }>;
}

// Processed transaction for display
export interface ProcessedTransaction {
  signature: string;
  description: string;
  type: string;
  date: Date;
  amount: number;
  symbol: string;
  direction: "incoming" | "outgoing" | "swap" | "other";
  fee: number;
  isNative: boolean;
  counterparty?: string;
  tokenMint?: string;
}

// Transaction analytics summary
export interface TransactionAnalytics {
  totalTransactions: number;
  incomingTransactions: number;
  outgoingTransactions: number;
  swapTransactions: number;
  totalFeesSpent: number;
  totalReceived: number;
  totalSent: number;
  mostActiveTokens: Array<{
    symbol: string;
    count: number;
    volume: number;
  }>;
  recentActivity: ProcessedTransaction[];
  timeRange: {
    oldest: Date;
    newest: Date;
  };
}

/**
 * Fetches transaction data from Helius API with domain resolution support
 */
export async function fetchTransactionData(
  walletAddress: string,
  limit: number = 25
): Promise<TransactionData[]> {
  const apiKey = config.helius?.apiKey;

  if (!apiKey) {
    throw new Error("Helius API key is not configured");
  }

  // Resolve address if it's a domain
  let resolvedAddress: string;
  try {
    if (isValidRecipient(walletAddress)) {
      // Check if it's a domain that needs resolution
      if (walletAddress.endsWith('.sol')) {
        const connection = new Connection(
          process.env.NEXT_PUBLIC_HELIUS_RPC_URL || 
          'https://api.mainnet-beta.solana.com'
        );
        const resolution = await resolveRecipient(walletAddress, connection);
        resolvedAddress = resolution.address;
      } else {
        resolvedAddress = walletAddress;
      }
    } else {
      throw new Error(`Invalid wallet address format: ${sanitizeAddress(walletAddress)}`);
    }
  } catch (error) {
    // Provide helpful error message with troubleshooting steps
    const message = walletAddress.endsWith('.sol') 
      ? `Unable to resolve domain "${walletAddress}". This could mean:
        • The domain is not registered
        • The domain registration has expired  
        • There may be a temporary issue with domain resolution
        
        Troubleshooting steps:
        • Verify the domain spelling
        • Check if the domain is registered on a .sol domain service
        • Try using the actual wallet address instead
        • Wait a moment and try again`
      : `Invalid wallet address format: ${sanitizeAddress(walletAddress)}. ${
          error instanceof Error ? error.message : 'Unknown error'
        }`;
    
    throw new Error(message);
  }

  try {
    const url = `https://api.helius.xyz/v0/addresses/${resolvedAddress}/transactions?api-key=${apiKey}&limit=${limit}`;

    const response = await fetch(url, {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(
        `HTTP error! status: ${response.status}, body: ${errorBody}`
      );
    }

    return await response.json();
  } catch (error) {
    throw new Error(
      `Failed to fetch transaction data for address ${sanitizeAddress(
        resolvedAddress
      )}: ${error instanceof Error ? error.message : String(error)}`,
      { cause: error }
    );
  }
}

/**
 * Processes raw transaction data into display-friendly format
 */
export function processTransactionData(
  rawTransactions: TransactionData[],
  userWallet: string
): ProcessedTransaction[] {
  return rawTransactions
    .map((tx) => processTransaction(tx, userWallet))
    .filter((tx) => tx !== null) as ProcessedTransaction[];
}

/**
 * Processes a single transaction
 */
function processTransaction(
  tx: TransactionData,
  userWallet: string
): ProcessedTransaction | null {
  try {
    const date = new Date(tx.timestamp * 1000);

    // Handle native SOL transfers
    const nativeTransfer = tx.nativeTransfers.find(
      (transfer) =>
        transfer.fromUserAccount === userWallet ||
        transfer.toUserAccount === userWallet
    );

    if (nativeTransfer) {
      const isIncoming = nativeTransfer.toUserAccount === userWallet;
      const amount = nativeTransfer.amount / 1e9; // Convert lamports to SOL
      const counterparty = isIncoming
        ? nativeTransfer.fromUserAccount
        : nativeTransfer.toUserAccount;

      return {
        signature: tx.signature,
        description:
          tx.description ||
          getTransactionDescription(tx.type, isIncoming, amount),
        type: tx.type,
        date,
        amount,
        symbol: "SOL",
        direction: isIncoming ? "incoming" : "outgoing",
        fee: tx.fee / 1e9, // Convert lamports to SOL
        isNative: true,
        counterparty,
      };
    }

    // Handle token transfers
    const tokenTransfer = tx.tokenTransfers.find(
      (transfer) =>
        transfer.fromUserAccount === userWallet ||
        transfer.toUserAccount === userWallet
    );

    if (tokenTransfer) {
      const isIncoming = tokenTransfer.toUserAccount === userWallet;
      const direction =
        tx.type === "SWAP" ? "swap" : isIncoming ? "incoming" : "outgoing";

      return {
        signature: tx.signature,
        description:
          tx.description ||
          getTransactionDescription(
            tx.type,
            isIncoming,
            tokenTransfer.tokenAmount
          ),
        type: tx.type,
        date,
        amount: tokenTransfer.tokenAmount,
        symbol: getTokenSymbolFromMint(tokenTransfer.mint),
        direction,
        fee: tx.fee / 1e9,
        isNative: false,
        counterparty: isIncoming
          ? tokenTransfer.fromUserAccount
          : tokenTransfer.toUserAccount,
        tokenMint: tokenTransfer.mint,
      };
    }

    // Handle other transaction types (mints, etc.)
    if (tx.type === "COMPRESSED_NFT_MINT" || tx.type === "UNKNOWN") {
      return {
        signature: tx.signature,
        description: tx.description || `${tx.type} transaction`,
        type: tx.type,
        date,
        amount: 0,
        symbol: "N/A",
        direction: "other",
        fee: tx.fee / 1e9,
        isNative: false,
      };
    }

    return null;
  } catch (error) {
    console.warn(`Failed to process transaction ${tx.signature}:`, error);
    return null;
  }
}

/**
 * Analyzes processed transactions to generate insights
 */
export function analyzeTransactions(
  transactions: ProcessedTransaction[]
): TransactionAnalytics {
  if (transactions.length === 0) {
    return {
      totalTransactions: 0,
      incomingTransactions: 0,
      outgoingTransactions: 0,
      swapTransactions: 0,
      totalFeesSpent: 0,
      totalReceived: 0,
      totalSent: 0,
      mostActiveTokens: [],
      recentActivity: [],
      timeRange: {
        oldest: new Date(),
        newest: new Date(),
      },
    };
  }

  const incomingTransactions = transactions.filter(
    (tx) => tx.direction === "incoming"
  ).length;
  const outgoingTransactions = transactions.filter(
    (tx) => tx.direction === "outgoing"
  ).length;
  const swapTransactions = transactions.filter(
    (tx) => tx.direction === "swap"
  ).length;

  const totalFeesSpent = transactions.reduce((sum, tx) => sum + tx.fee, 0);
  const totalReceived = transactions
    .filter((tx) => tx.direction === "incoming" && tx.isNative)
    .reduce((sum, tx) => sum + tx.amount, 0);
  const totalSent = transactions
    .filter((tx) => tx.direction === "outgoing" && tx.isNative)
    .reduce((sum, tx) => sum + tx.amount, 0);

  // Analyze token activity
  const tokenActivity = new Map<string, { count: number; volume: number }>();
  transactions.forEach((tx) => {
    if (tx.symbol && tx.symbol !== "N/A") {
      const existing = tokenActivity.get(tx.symbol) || { count: 0, volume: 0 };
      tokenActivity.set(tx.symbol, {
        count: existing.count + 1,
        volume: existing.volume + tx.amount,
      });
    }
  });

  const mostActiveTokens = Array.from(tokenActivity.entries())
    .map(([symbol, data]) => ({ symbol, ...data }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  const dates = transactions
    .map((tx) => tx.date)
    .sort((a, b) => a.getTime() - b.getTime());

  return {
    totalTransactions: transactions.length,
    incomingTransactions,
    outgoingTransactions,
    swapTransactions,
    totalFeesSpent,
    totalReceived,
    totalSent,
    mostActiveTokens,
    recentActivity: transactions.slice(0, 10), // Most recent 10
    timeRange: {
      oldest: dates[0] || new Date(),
      newest: dates[dates.length - 1] || new Date(),
    },
  };
}

/**
 * Generates human-readable description for transactions
 */
function getTransactionDescription(
  type: string,
  isIncoming: boolean,
  amount: number
): string {
  switch (type) {
    case "TRANSFER":
      return isIncoming ? `Received ${amount} tokens` : `Sent ${amount} tokens`;
    case "SWAP":
      return `Swapped ${amount} tokens`;
    case "COMPRESSED_NFT_MINT":
      return "Minted compressed NFT";
    default:
      return `${type} transaction`;
  }
}

/**
 * Gets token symbol from mint address (simplified - in real app you'd maintain a token registry)
 */
function getTokenSymbolFromMint(mint: string): string {
  return MINT_TO_SYMBOL_MAP[mint] || `TOKEN_${mint.slice(0, 4)}`;
}

/**
 * Generates analytics string for AI consumption
 */
export function generateTransactionAnalyticsString(
  analytics: TransactionAnalytics
): string {
  let analyticsString = `📊 **Transaction History Analytics**\n\n`;

  analyticsString += `📈 **Activity Summary:**\n`;
  analyticsString += `• Total Transactions: ${analytics.totalTransactions}\n`;
  analyticsString += `• Incoming: ${analytics.incomingTransactions} transactions\n`;
  analyticsString += `• Outgoing: ${analytics.outgoingTransactions} transactions\n`;
  analyticsString += `• Swaps: ${analytics.swapTransactions} transactions\n`;
  analyticsString += `• Total Fees Spent: ${analytics.totalFeesSpent.toFixed(
    6
  )} SOL\n\n`;

  if (analytics.totalReceived > 0 || analytics.totalSent > 0) {
    analyticsString += `💰 **SOL Activity:**\n`;
    analyticsString += `• Total Received: ${analytics.totalReceived.toFixed(
      4
    )} SOL\n`;
    analyticsString += `• Total Sent: ${analytics.totalSent.toFixed(
      4
    )} SOL\n\n`;
  }

  if (analytics.mostActiveTokens.length > 0) {
    analyticsString += `🔥 **Most Active Tokens:**\n`;
    analytics.mostActiveTokens.slice(0, 3).forEach((token, index) => {
      analyticsString += `${index + 1}. ${token.symbol}: ${
        token.count
      } transactions\n`;
    });
    analyticsString += `\n`;
  }

  analyticsString += `📅 **Time Range:**\n`;
  analyticsString += `• From: ${analytics.timeRange.oldest.toLocaleDateString()}\n`;
  analyticsString += `• To: ${analytics.timeRange.newest.toLocaleDateString()}\n`;

  return analyticsString;
}

/**
 * Filters transactions for display (removes negligible amounts, spam, etc.)
 */
export function filterTransactionsForDisplay(
  transactions: ProcessedTransaction[],
  minAmount: number = 0.001
): ProcessedTransaction[] {
  return transactions.filter((tx) => {
    // Always show non-monetary transactions
    if (tx.direction === "other") return true;

    // Show all transactions above minimum amount
    if (tx.amount >= minAmount) return true;

    // Show swaps regardless of amount
    if (tx.direction === "swap") return true;

    return false;
  });
}

/**
 * Sanitizes wallet address for safe logging
 */
function sanitizeAddress(address: string): string {
  if (address.length <= 8) return address;
  return `${address.slice(0, 4)}...${address.slice(-4)}`;
}
