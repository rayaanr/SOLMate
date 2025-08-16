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
  
  isTransactionPreparing: boolean;
  isSwapPreparing: boolean;
  isPortfolioPreparing: boolean;
  cleanContent: string;
}

export function parseMessageData(content: string): ParsedMessageData {
  // Check for transaction data states
  const hasTransactionStart = content.includes("[TRANSACTION_DATA]");
  const hasTransactionEnd = content.includes("[/TRANSACTION_DATA]");
  const transactionMatch = content.match(/\[TRANSACTION_DATA\](.*?)\[\/TRANSACTION_DATA\]/);
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

  // Check if transaction/swap/portfolio is being prepared (started but not finished)
  const isTransactionPreparing = hasTransactionStart && !hasTransactionEnd;
  const isSwapPreparing = hasSwapStart && !hasSwapEnd;
  const isPortfolioPreparing = hasPortfolioStart && !hasPortfolioEnd;

  // Clean content without transaction/swap/portfolio data (including partial streaming)
  let cleanContent = content;

  // Remove complete transaction data blocks
  cleanContent = cleanContent.replace(/\[TRANSACTION_DATA\].*?\[\/TRANSACTION_DATA\]/g, "");

  // Remove complete swap data blocks  
  cleanContent = cleanContent.replace(/\[SWAP_DATA\].*?\[\/SWAP_DATA\]/g, "");

  // Remove complete portfolio data blocks
  cleanContent = cleanContent.replace(/\[PORTFOLIO_DATA\].*?\[\/PORTFOLIO_DATA\]/g, "");

  // Remove partial transaction data that's still streaming
  cleanContent = cleanContent.replace(/\[TRANSACTION_DATA\].*$/g, "");

  // Remove partial swap data that's still streaming
  cleanContent = cleanContent.replace(/\[SWAP_DATA\].*$/g, "");

  // Remove partial portfolio data that's still streaming
  cleanContent = cleanContent.replace(/\[PORTFOLIO_DATA\].*$/g, "");

  // Trim the result
  cleanContent = cleanContent.trim();

  // Parse JSON data safely
  let transactionData = null;
  let swapData = null;
  let portfolioData = null;

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
    
    isTransactionPreparing,
    isSwapPreparing,
    isPortfolioPreparing,
    cleanContent,
  };
}
