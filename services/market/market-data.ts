import { CoinMarketData, MarketDataResponse } from "../../types/market";
import { createMarketAnalytics } from "../utils/market-analytics";

const COINGECKO_BASE_URL = "https://api.coingecko.com/api/v3";
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes in milliseconds

interface CachedMarketData {
  data: MarketDataResponse;
  timestamp: number;
}

let marketDataCache: CachedMarketData | null = null;

/**
 * Fetches Solana ecosystem market data from CoinGecko API
 * @param perPage Number of coins to fetch (default: 50)
 * @returns Promise<MarketDataResponse>
 */
export async function fetchSolanaMarketData(
  perPage: number = 50
): Promise<MarketDataResponse> {
  // Check cache first
  if (
    marketDataCache &&
    Date.now() - marketDataCache.timestamp < CACHE_DURATION
  ) {
    console.log("Returning cached market data");
    return marketDataCache.data;
  }

  try {
    const url = `${COINGECKO_BASE_URL}/coins/markets?vs_currency=usd&category=solana-ecosystem&order=market_cap_desc&per_page=${perPage}&page=1`;

    console.log("Fetching market data from CoinGecko...");

    const response = await fetch(url, {
      headers: {
        Accept: "application/json",
        "User-Agent": "SOLMate-App/1.0",
      },
    });

    if (!response.ok) {
      throw new Error(
        `CoinGecko API error: ${response.status} ${response.statusText}`
      );
    }

    const dataRaw: unknown = await response.json();

    if (!Array.isArray(dataRaw)) {
      throw new Error("Invalid response format from CoinGecko API");
    }

    const data: CoinMarketData[] = (dataRaw as any[]).map((c) => ({
      id: c.id,
      symbol: c.symbol,
      name: c.name,
      image: c.image,
      current_price: typeof c.current_price === "number" ? c.current_price : 0,
      market_cap: typeof c.market_cap === "number" ? c.market_cap : 0,
      market_cap_rank:
        typeof c.market_cap_rank === "number" ? c.market_cap_rank : undefined,
      total_volume: typeof c.total_volume === "number" ? c.total_volume : 0,
      price_change_percentage_24h:
        typeof c.price_change_percentage_24h === "number"
          ? c.price_change_percentage_24h
          : 0,
      // spread any other fields to maintain compatibility
      ...c,
    }));

    // Generate analytics from the raw data
    const analytics = createMarketAnalytics(data);

    const marketDataResponse: MarketDataResponse = {
      data,
      analytics,
      timestamp: Date.now(),
    };

    // Update cache
    marketDataCache = {
      data: marketDataResponse,
      timestamp: Date.now(),
    };

    console.log(`Fetched ${data.length} coins from Solana ecosystem`);
    return marketDataResponse;
  } catch (error) {
    console.error("Error fetching market data:", error);

    // Return cached data if available, even if expired
    if (marketDataCache) {
      console.log("Returning stale cached market data due to fetch error");
      return marketDataCache.data;
    }

    throw error;
  }
}

/**
 * Clears the market data cache
 */
export function clearMarketDataCache(): void {
  marketDataCache = null;
  console.log("Market data cache cleared");
}

/**
 * Gets cached market data if available and not expired
 */
export function getCachedMarketData(): MarketDataResponse | null {
  if (
    marketDataCache &&
    Date.now() - marketDataCache.timestamp < CACHE_DURATION
  ) {
    return marketDataCache.data;
  }
  return null;
}
