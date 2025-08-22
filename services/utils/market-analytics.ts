import { CoinMarketData, MarketAnalytics } from '@/types/market';

/**
 * Creates market analytics from raw coin data
 */
export function createMarketAnalytics(coins: CoinMarketData[]): MarketAnalytics {
  if (!coins || coins.length === 0) {
    return {
      topGainers: [],
      topLosers: [],
      totalMarketCap: 0,
      totalVolume: 0,
      averageChange24h: 0,
      marketSummary: 'No market data available'
    };
  }

  // Sort by 24h percentage change for gainers and losers
  const sortedByChange = [...coins].sort((a, b) => b.price_change_percentage_24h - a.price_change_percentage_24h);
  
  const topGainers = sortedByChange.slice(0, 5);
  const topLosers = sortedByChange.slice(-5).reverse();

  // Calculate totals
  const totalMarketCap = coins.reduce((sum, coin) => sum + coin.market_cap, 0);
  const totalVolume = coins.reduce((sum, coin) => sum + coin.total_volume, 0);
  
  // Calculate average 24h change
  const totalChange = coins.reduce((sum, coin) => sum + coin.price_change_percentage_24h, 0);
  const averageChange24h = totalChange / coins.length;

  // Generate market summary
  const marketSummary = generateMarketSummary(coins, averageChange24h);

  return {
    topGainers,
    topLosers,
    totalMarketCap,
    totalVolume,
    averageChange24h,
    marketSummary
  };
}

/**
 * Generates a text summary of market conditions
 */
function generateMarketSummary(coins: CoinMarketData[], averageChange24h: number): string {
  const gainersCount = coins.filter(coin => coin.price_change_percentage_24h > 0).length;
  const losersCount = coins.filter(coin => coin.price_change_percentage_24h < 0).length;
  const neutralCount = coins.length - gainersCount - losersCount;

  const marketSentiment = averageChange24h > 2 ? 'bullish' 
                        : averageChange24h < -2 ? 'bearish' 
                        : 'mixed';

  const topCoin = coins[0]; // Highest market cap
  const bestPerformer = coins.reduce((prev, current) => 
    prev.price_change_percentage_24h > current.price_change_percentage_24h ? prev : current
  );
  const worstPerformer = coins.reduce((prev, current) => 
    prev.price_change_percentage_24h < current.price_change_percentage_24h ? prev : current
  );

  return `The Solana ecosystem shows ${marketSentiment} sentiment with ${gainersCount} tokens up, ${losersCount} down, and ${neutralCount} neutral. ` +
         `${topCoin.name} leads with $${formatNumber(topCoin.market_cap)} market cap. ` +
         `Best performer: ${bestPerformer.name} (+${bestPerformer.price_change_percentage_24h.toFixed(2)}%). ` +
         `Worst performer: ${worstPerformer.name} (${worstPerformer.price_change_percentage_24h.toFixed(2)}%).`;
}

/**
 * Formats large numbers with appropriate suffixes
 */
export function formatNumber(num: number): string {
  if (num >= 1e12) return (num / 1e12).toFixed(2) + 'T';
  if (num >= 1e9) return (num / 1e9).toFixed(2) + 'B';
  if (num >= 1e6) return (num / 1e6).toFixed(2) + 'M';
  if (num >= 1e3) return (num / 1e3).toFixed(2) + 'K';
  return num.toFixed(2);
}

/**
 * Formats price with appropriate decimal places
 */
export function formatPrice(price: number): string {
  if (price >= 1000) return `$${price.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
  if (price >= 1) return `$${price.toFixed(4)}`;
  if (price >= 0.01) return `$${price.toFixed(6)}`;
  return `$${price.toFixed(8)}`;
}

/**
 * Formats percentage change with color indication
 */
export function formatPercentageChange(change: number): { value: string; isPositive: boolean } {
  const isPositive = change >= 0;
  const formattedChange = Math.abs(change).toFixed(2);
  const sign = isPositive ? '+' : '-';
  
  return {
    value: `${sign}${formattedChange}%`,
    isPositive
  };
}

/**
 * Gets the market trend based on 24h change
 */
export function getMarketTrend(averageChange24h: number): 'bullish' | 'bearish' | 'mixed' {
  if (averageChange24h > 2) return 'bullish';
  if (averageChange24h < -2) return 'bearish';
  return 'mixed';
}

/**
 * Finds coins by symbol or name (case insensitive)
 */
export function findCoinsByQuery(coins: CoinMarketData[], query: string): CoinMarketData[] {
  const searchTerm = query.toLowerCase().trim();
  
  return coins.filter(coin => 
    coin.symbol.toLowerCase().includes(searchTerm) || 
    coin.name.toLowerCase().includes(searchTerm)
  );
}

/**
 * Gets market stats for a specific timeframe
 */
export function getMarketStats(coins: CoinMarketData[]) {
  const stats = {
    totalCoins: coins.length,
    totalMarketCap: coins.reduce((sum, coin) => sum + coin.market_cap, 0),
    totalVolume: coins.reduce((sum, coin) => sum + coin.total_volume, 0),
    averagePrice: coins.reduce((sum, coin) => sum + coin.current_price, 0) / coins.length,
    medianMarketCap: getMedian(coins.map(coin => coin.market_cap)),
    gainers: coins.filter(coin => coin.price_change_percentage_24h > 0).length,
    losers: coins.filter(coin => coin.price_change_percentage_24h < 0).length,
  };

  return stats;
}

/**
 * Helper function to calculate median
 */
function getMedian(numbers: number[]): number {
  const sorted = [...numbers].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  
  if (sorted.length % 2 === 0) {
    return (sorted[middle - 1] + sorted[middle]) / 2;
  }
  
  return sorted[middle];
}
