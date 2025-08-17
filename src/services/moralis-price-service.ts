import { MoralisTokenPrice, TokenPriceMap } from '../types/market';

const MORALIS_BASE_URL = 'https://solana-gateway.moralis.io';
const CACHE_DURATION = 2 * 60 * 1000; // 2 minutes in milliseconds

interface CachedTokenPrices {
  data: TokenPriceMap;
  timestamp: number;
}

let tokenPriceCache: CachedTokenPrices | null = null;

/**
 * Fetches token prices from Moralis API for multiple token addresses
 * @param tokenAddresses Array of Solana token addresses to fetch prices for
 * @returns Promise<TokenPriceMap>
 */
export async function fetchTokenPrices(tokenAddresses: string[]): Promise<TokenPriceMap> {
  if (!tokenAddresses || tokenAddresses.length === 0) {
    return {};
  }

  // Check cache first - only return cached data if it contains all requested tokens
  if (tokenPriceCache && Date.now() - tokenPriceCache.timestamp < CACHE_DURATION) {
    const hasAllTokens = tokenAddresses.every(address => address in tokenPriceCache!.data);
    if (hasAllTokens) {
      console.log('Returning cached token prices');
      const filteredData: TokenPriceMap = {};
      tokenAddresses.forEach(address => {
        if (tokenPriceCache!.data[address]) {
          filteredData[address] = tokenPriceCache!.data[address];
        }
      });
      return filteredData;
    }
  }

  const moralisApiKey = process.env.MORALIS_API_KEY;
  if (!moralisApiKey) {
    console.error('MORALIS_API_KEY is not configured');
    return {};
  }

  try {
    const url = `${MORALIS_BASE_URL}/token/mainnet/prices`;
    
    console.log(`Fetching prices for ${tokenAddresses.length} tokens from Moralis...`);
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'X-API-Key': moralisApiKey,
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        addresses: tokenAddresses
      })
    });

    if (!response.ok) {
      throw new Error(`Moralis API error: ${response.status} ${response.statusText}`);
    }

    const data: MoralisTokenPrice[] = await response.json();
    
    if (!Array.isArray(data)) {
      throw new Error('Invalid response format from Moralis API');
    }

    // Convert array to map for easier lookup
    const priceMap: TokenPriceMap = {};
    data.forEach(tokenPrice => {
      priceMap[tokenPrice.tokenAddress] = tokenPrice;
    });

    // Update cache - merge with existing data
    const updatedCache = tokenPriceCache?.data || {};
    Object.assign(updatedCache, priceMap);
    
    tokenPriceCache = {
      data: updatedCache,
      timestamp: Date.now()
    };

    console.log(`Fetched prices for ${data.length} tokens from Moralis`);
    return priceMap;

  } catch (error) {
    console.error('Error fetching token prices from Moralis:', error);
    
    // Return cached data if available for the requested tokens, even if expired
    if (tokenPriceCache) {
      console.log('Returning stale cached token prices due to fetch error');
      const filteredData: TokenPriceMap = {};
      tokenAddresses.forEach(address => {
        if (tokenPriceCache!.data[address]) {
          filteredData[address] = tokenPriceCache!.data[address];
        }
      });
      return filteredData;
    }
    
    return {};
  }
}

/**
 * Fetches price for a single token address
 * @param tokenAddress Solana token address
 * @returns Promise<MoralisTokenPrice | null>
 */
export async function fetchTokenPrice(tokenAddress: string): Promise<MoralisTokenPrice | null> {
  const prices = await fetchTokenPrices([tokenAddress]);
  return prices[tokenAddress] || null;
}

/**
 * Clears the token price cache
 */
export function clearTokenPriceCache(): void {
  tokenPriceCache = null;
  console.log('Token price cache cleared');
}

/**
 * Gets cached token prices if available and not expired
 */
export function getCachedTokenPrices(tokenAddresses: string[]): TokenPriceMap | null {
  if (!tokenPriceCache || Date.now() - tokenPriceCache.timestamp >= CACHE_DURATION) {
    return null;
  }

  const hasAllTokens = tokenAddresses.every(address => address in tokenPriceCache!.data);
  if (!hasAllTokens) {
    return null;
  }

  const filteredData: TokenPriceMap = {};
  tokenAddresses.forEach(address => {
    if (tokenPriceCache!.data[address]) {
      filteredData[address] = tokenPriceCache!.data[address];
    }
  });
  
  return filteredData;
}
