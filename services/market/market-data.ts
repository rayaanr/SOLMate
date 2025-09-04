import { CoinMarketData, MarketDataResponse } from "../../types/market";
import { createMarketAnalytics } from "../utils/market-analytics";

const COINGECKO_BASE_URL = "https://api.coingecko.com/api/v3";
const CACHE_DURATION = 5 * 60; // 5 minutes in seconds

/**
 * Fetches Solana ecosystem market data from CoinGecko API with Next.js caching
 * @param perPage Number of coins to fetch (default: 50)
 * @returns Promise<MarketDataResponse>
 */
export async function fetchSolanaMarketData(
  perPage: number = 50
): Promise<MarketDataResponse> {
  try {
    const url = `${COINGECKO_BASE_URL}/coins/markets?vs_currency=usd&category=solana-ecosystem&order=market_cap_desc&per_page=${perPage}&page=1`;

    // Use Next.js fetch with caching and revalidation
    const response = await fetch(url, {
      headers: {
        Accept: "application/json",
        "User-Agent": "SOLMate-App/1.0",
      },
      // Enable Next.js caching with revalidation
      next: {
        revalidate: CACHE_DURATION, // Revalidate every 5 minutes
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
      // Spread first so sanitized fields below take precedence
      ...c,
      id: String(c.id ?? ""),
      symbol: String(c.symbol ?? ""),
      name: String(c.name ?? ""),
      image: typeof c.image === "string" ? c.image : "",
      current_price: typeof c.current_price === "number" ? c.current_price : 0,
      market_cap: typeof c.market_cap === "number" ? c.market_cap : 0,
      market_cap_rank:
        typeof c.market_cap_rank === "number" ? c.market_cap_rank : 0,
      total_volume: typeof c.total_volume === "number" ? c.total_volume : 0,
      price_change_percentage_24h:
        typeof c.price_change_percentage_24h === "number"
          ? c.price_change_percentage_24h
          : 0,
    }));

    // Generate analytics from the raw data
    const analytics = createMarketAnalytics(data);

    const marketDataResponse: MarketDataResponse = {
      data,
      analytics,
      timestamp: Date.now(),
    };

    return marketDataResponse;
  } catch (error) {
    console.error("Error fetching market data:", error);
    throw error;
  }
}

/**
 * Fetches market data with manual cache control for API routes
 * @param perPage Number of coins to fetch (default: 50)
 * @returns Promise<MarketDataResponse>
 */
export async function fetchSolanaMarketDataWithCache(
  perPage: number = 50
): Promise<{ data: MarketDataResponse; cacheStatus: string }> {
  try {
    const url = `${COINGECKO_BASE_URL}/coins/markets?vs_currency=usd&category=solana-ecosystem&order=market_cap_desc&per_page=${perPage}&page=1`;

    // Use fetch with cache control headers
    const response = await fetch(url, {
      headers: {
        Accept: "application/json",
        "User-Agent": "SOLMate-App/1.0",
      },
      // Use Next.js cache with revalidation
      next: {
        revalidate: CACHE_DURATION,
      },
      // Ensure we're using the cache correctly
      cache: "force-cache",
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

    // Determine cache status
    const cacheStatus = response.headers.get("x-vercel-cache") || "MISS";

    return { data: marketDataResponse, cacheStatus };
  } catch (error) {
    console.error("Error fetching market data:", error);
    throw error;
  }
}
