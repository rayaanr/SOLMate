export interface ParsedMessageData {
  hasTransactionStart: boolean;
  hasTransactionEnd: boolean;
  hasCompleteTransaction: boolean;
  transactionMatch: RegExpMatchArray | null;
  transactionData: any;
  
  hasSwapStart: boolean;
  hasSwapEnd: boolean;
  hasCompleteSwap: boolean;
  swapMatch: RegExpMatchArray | null;
  swapData: any;
  
  hasPortfolioStart: boolean;
  hasPortfolioEnd: boolean;
  hasCompletePortfolio: boolean;
  portfolioMatch: RegExpMatchArray | null;
  portfolioData: any;
  
  hasTransactionHistoryStart: boolean;
  hasTransactionHistoryEnd: boolean;
  hasCompleteTransactionHistory: boolean;
  transactionHistoryMatch: RegExpMatchArray | null;
  transactionHistoryData: any;
  
  hasNftStart: boolean;
  hasNftEnd: boolean;
  hasCompleteNfts: boolean;
  nftMatch: RegExpMatchArray | null;
  nftData: any;
  
  hasMarketStart: boolean;
  hasMarketEnd: boolean;
  hasCompleteMarket: boolean;
  marketMatch: RegExpMatchArray | null;
  marketData: any;
  
  isTransactionPreparing: boolean;
  isSwapPreparing: boolean;
  isPortfolioPreparing: boolean;
  isTransactionHistoryPreparing: boolean;
  isNftPreparing: boolean;
  isMarketPreparing: boolean;
  cleanContent: string;
}

export function parseMessageData(content: string): ParsedMessageData {
  // Check for transaction data states (for transaction preparation)
  const hasTransactionStart = content.includes("[TRANSACTION_DATA]") && !content.includes("transactions");
  const hasTransactionEnd = content.includes("[/TRANSACTION_DATA]") && !content.includes("transactions");
  const transactionMatch = content.match(/\[TRANSACTION_DATA\]((?!.*transactions).*?)\[\/TRANSACTION_DATA\]/);
  const hasCompleteTransaction = transactionMatch !== null;

  // Check for swap data states
  const hasSwapStart = content.includes("[SWAP_DATA]");
  const hasSwapEnd = content.includes("[/SWAP_DATA]");
  const swapMatch = content.match(/\[SWAP_DATA\](.*?)\[\/SWAP_DATA\]/);
  const hasCompleteSwap = swapMatch !== null;

  // Check for portfolio data states
  const hasPortfolioStart = content.includes("[PORTFOLIO_DATA]");
  const hasPortfolioEnd = content.includes("[/PORTFOLIO_DATA]");
  const portfolioMatch = content.match(/\[PORTFOLIO_DATA\](.*?)\[\/PORTFOLIO_DATA\]/);
  const hasCompletePortfolio = portfolioMatch !== null;

  // Check for transaction history data states (separate from transaction preparation)
  const hasTransactionHistoryStart = content.includes("[TRANSACTION_DATA]") && content.includes("transactions");
  const hasTransactionHistoryEnd = content.includes("[/TRANSACTION_DATA]") && content.includes("transactions");
  const transactionHistoryMatch = content.match(/\[TRANSACTION_DATA\](.*?transactions.*?)\[\/TRANSACTION_DATA\]/);
  const hasCompleteTransactionHistory = transactionHistoryMatch !== null;

  // Check for NFT data states
  const hasNftStart = content.includes("[NFT_DATA]");
  const hasNftEnd = content.includes("[/NFT_DATA]");
  const nftMatch = content.match(/\[NFT_DATA\](.*?)\[\/NFT_DATA\]/);
  const hasCompleteNfts = nftMatch !== null;

  // Check for market data states
  const hasMarketStart = content.includes("[MARKET_DATA]");
  const hasMarketEnd = content.includes("[/MARKET_DATA]");
  const marketMatch = content.match(/\[MARKET_DATA\](.*?)\[\/MARKET_DATA\]/);
  const hasCompleteMarket = marketMatch !== null;

  // Check if transaction/swap/portfolio/transaction history/NFT/market is being prepared (started but not finished)
  const isTransactionPreparing = hasTransactionStart && !hasTransactionEnd;
  const isSwapPreparing = hasSwapStart && !hasSwapEnd;
  const isPortfolioPreparing = hasPortfolioStart && !hasPortfolioEnd;
  const isTransactionHistoryPreparing = hasTransactionHistoryStart && !hasTransactionHistoryEnd;
  const isNftPreparing = hasNftStart && !hasNftEnd;
  const isMarketPreparing = hasMarketStart && !hasMarketEnd;

  // Clean content without transaction/swap/portfolio data (including partial streaming)
  let cleanContent = content;

  // Remove complete transaction data blocks
  cleanContent = cleanContent.replace(/\[TRANSACTION_DATA\].*?\[\/TRANSACTION_DATA\]/g, "");

  // Remove complete swap data blocks  
  cleanContent = cleanContent.replace(/\[SWAP_DATA\].*?\[\/SWAP_DATA\]/g, "");

  // Remove complete portfolio data blocks
  cleanContent = cleanContent.replace(/\[PORTFOLIO_DATA\].*?\[\/PORTFOLIO_DATA\]/g, "");

  // Remove complete NFT data blocks
  cleanContent = cleanContent.replace(/\[NFT_DATA\].*?\[\/NFT_DATA\]/g, "");

  // Remove complete market data blocks
  cleanContent = cleanContent.replace(/\[MARKET_DATA\].*?\[\/MARKET_DATA\]/g, "");

  // Remove partial transaction data that's still streaming
  cleanContent = cleanContent.replace(/\[TRANSACTION_DATA\].*$/g, "");

  // Remove partial swap data that's still streaming
  cleanContent = cleanContent.replace(/\[SWAP_DATA\].*$/g, "");

  // Remove partial portfolio data that's still streaming
  cleanContent = cleanContent.replace(/\[PORTFOLIO_DATA\].*$/g, "");

  // Remove partial NFT data that's still streaming
  cleanContent = cleanContent.replace(/\[NFT_DATA\].*$/g, "");

  // Remove partial market data that's still streaming
  cleanContent = cleanContent.replace(/\[MARKET_DATA\].*$/g, "");

  // Trim the result
  cleanContent = cleanContent.trim();

  // Parse JSON data safely
  let transactionData = null;
  let swapData = null;
  let portfolioData = null;
  let transactionHistoryData = null;
  let nftData = null;
  let marketData = null;

  try {
    if (transactionMatch) {
      transactionData = JSON.parse(transactionMatch[1]);
    }
  } catch {
    // Ignore parsing errors
  }

  try {
    if (swapMatch) {
      swapData = JSON.parse(swapMatch[1]);
    }
  } catch {
    // Ignore parsing errors
  }

  try {
    if (portfolioMatch) {
      portfolioData = JSON.parse(portfolioMatch[1]);
    }
  } catch {
    // Ignore parsing errors
  }

  try {
    if (transactionHistoryMatch) {
      transactionHistoryData = JSON.parse(transactionHistoryMatch[1]);
    }
  } catch {
    // Ignore parsing errors
  }

  try {
    if (nftMatch) {
      nftData = JSON.parse(nftMatch[1]);
    }
  } catch {
    // Ignore parsing errors
  }

  try {
    if (marketMatch) {
      marketData = JSON.parse(marketMatch[1]);
    }
  } catch {
    // Ignore parsing errors
  }

  return {
    hasTransactionStart,
    hasTransactionEnd,
    hasCompleteTransaction,
    transactionMatch,
    transactionData,
    
    hasSwapStart,
    hasSwapEnd,
    hasCompleteSwap,
    swapMatch,
    swapData,
    
    hasPortfolioStart,
    hasPortfolioEnd,
    hasCompletePortfolio,
    portfolioMatch,
    portfolioData,
    
    hasTransactionHistoryStart,
    hasTransactionHistoryEnd,
    hasCompleteTransactionHistory,
    transactionHistoryMatch,
    transactionHistoryData,
    
    hasNftStart,
    hasNftEnd,
    hasCompleteNfts,
    nftMatch,
    nftData,
    
    hasMarketStart,
    hasMarketEnd,
    hasCompleteMarket,
    marketMatch,
    marketData,
    
    isTransactionPreparing,
    isSwapPreparing,
    isPortfolioPreparing,
    isTransactionHistoryPreparing,
    isNftPreparing,
    isMarketPreparing,
    cleanContent,
  };
}
