import { WalletData } from "./wallet-data";

export interface TokenData {
  symbol: string;
  name: string;
  balance: string;
  usdValue: number;
  percentage: number;
}

export interface NftCollectionStat {
  name: string;
  count: number;
  percentage: number;
}

type Level = "Low" | "Medium" | "High";

export interface WalletAnalytics {
  totalUsdValue: number;
  solBalance: number;
  solUsdValue: number;
  tokenCount: number;
  nftCount: number;
  topTokens: TokenData[];
  diversificationScore: Level;
  concentrationRisk: Level;
  // NFT analytics (optional)
  nftCollections?: NftCollectionStat[];
  compressedNftCount?: number;
  compressedNftRatio?: number; // 0..1
}

/**
 * Analyzes SOL balance from wallet data
 */
export function analyzeSolBalance(nativeBalance: WalletData['native_balance']): {
  solBalance: number;
  solUsdValue: number;
} {
  const solBalance = nativeBalance?.solana ? parseFloat(nativeBalance.solana) : 0;
  const solUsdValue = nativeBalance?.usd_value ? parseFloat(nativeBalance.usd_value) : 0;

  return { solBalance, solUsdValue };
}

/**
 * Analyzes token holdings from wallet data
 */
export function analyzeTokens(tokens: unknown[]): {
  tokenAnalysis: TokenData[];
  totalTokenValue: number;
  tokenCount: number;
} {
  let totalTokenValue = 0;
  let tokenCount = 0;

  const tokenAnalysis: TokenData[] = tokens?.map((token: any) => {
    const rawUsdValue = parseFloat(token.usd_value || "0");
    const usdValue = isNaN(rawUsdValue) ? 0 : rawUsdValue;
    totalTokenValue += usdValue;
    tokenCount++;

    return {
      symbol: token.symbol || 'UNKNOWN',
      name: token.name || 'UNKNOWN',
      balance: token.amount_raw || '0',
      usdValue: usdValue,
      percentage: 0, // Will calculate after getting total
    };
  }) || [];

  return { tokenAnalysis, totalTokenValue, tokenCount };
}

/**
 * Calculates token percentages of total portfolio
 */
export function calculateTokenPercentages(
  tokens: TokenData[],
  totalValue: number
): TokenData[] {
  return tokens.map(token => ({
    ...token,
    percentage: totalValue > 0 ? (token.usdValue / totalValue) * 100 : 0
  }));
}

/**
 * Sorts tokens by USD value (descending)
 */
export function sortTokensByValue(tokens: TokenData[]): TokenData[] {
  return tokens.sort((a, b) => b.usdValue - a.usdValue);
}

/**
 * Calculates diversification score based on token count
 */
export function calculateDiversificationScore(tokenCount: number): Level {
  return tokenCount > 10 ? "High" : tokenCount > 5 ? "Medium" : "Low";
}

/**
 * Calculates concentration risk based on top token percentage
 */
export function calculateConcentrationRisk(topTokenPercentage: number): Level {
  return topTokenPercentage > 70 ? "High" : topTokenPercentage > 50 ? "Medium" : "Low";
}

/**
 * Analyzes NFT holdings and collection distribution
 */
export function analyzeNfts(nfts: WalletData["nfts"]): {
  nftCount: number;
  collections: NftCollectionStat[];
  compressedNftCount: number;
  compressedNftRatio: number;
} {
  const nftCount = nfts?.length || 0;
  const byCollection = new Map<string, number>();
  let compressed = 0;

  for (const nft of nfts || []) {
    const coll = (nft.collection?.name || "Uncategorized").trim();
    byCollection.set(coll, (byCollection.get(coll) || 0) + 1);
    if (nft.compressed) compressed++;
  }

  const collectionsUnsorted: NftCollectionStat[] = Array.from(byCollection.entries()).map(([name, count]) => ({
    name,
    count,
    percentage: nftCount > 0 ? (count / nftCount) * 100 : 0,
  }));
  const collections = collectionsUnsorted.sort((a, b) => b.count - a.count);

  return {
    nftCount,
    collections,
    compressedNftCount: compressed,
    compressedNftRatio: nftCount > 0 ? compressed / nftCount : 0,
  };
}

/**
 * Main function to analyze wallet data and return comprehensive analytics
 */
export function analyzeWalletData(walletData: WalletData): WalletAnalytics {
  try {
    if (!walletData) throw new Error("Invalid wallet data: null or undefined");
    
    const { tokens, nfts, native_balance } = walletData;
    const nftCount = nfts?.length || 0;

    // Analyze SOL balance
    const { solBalance, solUsdValue } = analyzeSolBalance(native_balance);
    let totalUsdValue = solUsdValue;

    // Analyze tokens
    const { tokenAnalysis, totalTokenValue, tokenCount } = analyzeTokens(tokens);
    totalUsdValue += totalTokenValue;

    // Analyze NFTs
    const nftStats = analyzeNfts(nfts || []);

    // Calculate percentages and sort tokens
    const tokensWithPercentages = calculateTokenPercentages(tokenAnalysis, totalUsdValue);
    const topTokens = sortTokensByValue(tokensWithPercentages);

    // Calculate risk metrics
    const diversificationScore = calculateDiversificationScore(tokenCount);
    const solPercentage = totalUsdValue > 0 ? (solUsdValue / totalUsdValue) * 100 : 0;
    const topTokenPercentage = Math.max(topTokens[0]?.percentage || 0, solPercentage);
    const concentrationRisk = calculateConcentrationRisk(topTokenPercentage);

    const analytics = {
      totalUsdValue,
      solBalance,
      solUsdValue,
      tokenCount,
      nftCount,
      topTokens,
      diversificationScore,
      concentrationRisk,
      // NFT analytics
      nftCollections: nftStats.collections,
      compressedNftCount: nftStats.compressedNftCount,
      compressedNftRatio: nftStats.compressedNftRatio,
    };
    
    return analytics;
  } catch (error) {
    console.error('wallet_analysis', error);
    throw new Error("Unable to analyze wallet data");
  }
}

/**
 * Generates human-readable analytics string from analytics data
 */
export function generateAnalyticsString(analytics: WalletAnalytics): string {
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
  analyticsString += `• Total Portfolio Value: $${totalUsdValue.toFixed(2)} USD\n`;
  analyticsString += `• Native SOL Balance: ${solBalance.toFixed(4)} SOL ($${solUsdValue.toFixed(2)})\n`;
  analyticsString += `• Token Holdings: ${tokenCount} different tokens\n`;
  analyticsString += `• NFT Collection: ${nftCount} NFTs\n\n`;

  if (topTokens.length > 0) {
    analyticsString += `💰 **Top Token Holdings:**\n`;
    topTokens.slice(0, 5).forEach((token, index) => {
      analyticsString += `${index + 1}. ${token.symbol}: $${token.usdValue.toFixed(2)} (${token.percentage.toFixed(1)}%)\n`;
    });
    analyticsString += `\n`;
  }

  // NFT Highlights
  if ((analytics.nftCollections?.length || 0) > 0) {
    analyticsString += `🖼️ **NFT Highlights:**\n`;
    const top = analytics.nftCollections!.slice(0, 5);
    top.forEach((c, i) => {
      analyticsString += `${i + 1}. ${c.name}: ${c.count} (${c.percentage.toFixed(1)}%)\n`;
    });
    if (typeof analytics.compressedNftRatio === "number") {
      analyticsString += `• Compressed NFTs: ${(analytics.compressedNftRatio * 100).toFixed(1)}%\n`;
    }
    analyticsString += `\n`;
  }

  analyticsString += `📈 **Risk Assessment:**\n`;
  analyticsString += `• Diversification Score: ${diversificationScore}\n`;
  analyticsString += `• Concentration Risk: ${concentrationRisk}\n`;

  if (concentrationRisk === "High") {
    analyticsString += `⚠️ *High concentration detected - consider diversifying*\n`;
  }

  return analyticsString;
}

/**
 * Generates NFT-focused analytics string from analytics data
 */
export function generateNftAnalyticsString(analytics: WalletAnalytics): string {
  let s = `🖼️ NFT Portfolio\n`;
  s += `• Total NFTs: ${analytics.nftCount}\n`;
  if ((analytics.nftCollections?.length || 0) > 0) {
    const top = analytics.nftCollections!.slice(0, 5);
    s += `• Top Collections:\n`;
    top.forEach((c, i) => {
      s += `  ${i + 1}. ${c.name}: ${c.count} (${c.percentage.toFixed(1)}%)\n`;
    });
  }
  if (typeof analytics.compressedNftRatio === "number") {
    s += `• Compressed Share: ${(analytics.compressedNftRatio * 100).toFixed(1)}%\n`;
  }
  return s;
}
