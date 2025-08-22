import { config } from "@/lib/config";
import { PublicKey } from "@solana/web3.js";
import { fetchTokenPrices } from "../market/moralis-price-service";


// In-memory cache for deduping API calls
const CACHE_TTL_MS = 30_000; // 30s
type CacheEntry = { data: WalletData; expiresAt: number };
const WALLET_CACHE = new Map<string, CacheEntry>();

// NFT data structure for the app
export interface NftAsset {
  mint: string;
  name: string;
  image_url: string | null;
  collection?: {
    name?: string | null;
    address?: string | null;
  };
  owner?: string;
  compressed?: boolean;
  attributes?: Array<{ trait_type?: string; value?: string | number }>;
}

// Main WalletData interface (public API - stays compatible with analytics module)
export interface WalletData {
  tokens: TokenData[];
  nfts: NftAsset[]; // was unknown[]
  native_balance: {
    solana: string;
    usd_value: string;
  };
}

// Moralis token balance endpoint response (/account/mainnet/{address}/tokens)
export interface MoralisTokenBalance {
  associatedTokenAddress: string;
  mint: string;
  amountRaw: string;
  amount: string;
  decimals: number;
  tokenStandard: number;
  name: string;
  symbol: string;
  logo: string | null;
  isVerifiedContract: boolean;
  possibleSpam: boolean;
}

// Moralis native balance endpoint response (/account/mainnet/{address}/balance)
export interface MoralisNativeBalance {
  lamports: string;
  solana: string;
}

// CoinGecko SOL price response
export interface CoinGeckoPriceResponse {
  solana: {
    usd: number;
  };
}

// Token data structure for analytics module compatibility
export interface TokenData {
  mint?: string;
  symbol: string;
  name: string;
  amount_raw: string;
  usd_value: string;
  amount?: string;
  logo?: string | null;
  isVerifiedContract?: boolean;
  possibleSpam?: boolean;
  // Additional fields for table display
  price_usd?: number;
  price_24h_pct?: number;
  price_24h_usd_change?: number;
}

/**
 * Fetches token balances from Moralis API
 */
async function fetchTokenBalances(
  address: string
): Promise<MoralisTokenBalance[]> {
  const apiKey = config.moralis.apiKey!;
  const baseUrl = config.moralis.baseUrl;

  try {
    const url = `${baseUrl}/account/mainnet/${address}/tokens?excludeSpam=false`;

    const response = await fetch(url, {
      method: "GET",
      headers: {
        accept: "application/json",
        "X-API-Key": apiKey,
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
      `Failed to fetch token balances for address ${sanitizeAddress(
        address
      )}: ${error instanceof Error ? error.message : String(error)}`,
      { cause: error }
    );
  }
}

/**
 * Fetches native SOL balance from Moralis API
 */
async function fetchNativeBalance(
  address: string
): Promise<MoralisNativeBalance> {
  const apiKey = config.moralis.apiKey!;
  const baseUrl = config.moralis.baseUrl;

  try {
    const url = `${baseUrl}/account/mainnet/${address}/balance`;

    const response = await fetch(url, {
      method: "GET",
      headers: {
        accept: "application/json",
        "X-API-Key": apiKey,
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
      `Failed to fetch native SOL balance for address ${sanitizeAddress(
        address
      )}: ${error instanceof Error ? error.message : String(error)}`,
      { cause: error }
    );
  }
}

// Helius v0 NFT response minimal typing
interface HeliusNft {
  mint: string;
  name?: string;
  collection?: { name?: string; address?: string };
  content?: {
    files?: Array<{ uri?: string; mime?: string }>;
    links?: { image?: string };
  };
  externalMetadata?: {
    name?: string;
    image?: string;
    attributes?: any[];
    collection?: { name?: string };
  };
  compressed?: boolean;
  owner?: string;
}

/**
 * Fetches NFTs from Helius v0 API
 */
async function fetchNftsFromHelius(address: string): Promise<NftAsset[]> {
  const apiKey = config.helius.apiKey!;
  const baseUrl = config.helius.baseUrl;
  const url = `${baseUrl}/addresses/${address}/nfts?api-key=${apiKey}`;

  try {
    const res = await fetch(url);
    if (!res.ok) {
      const body = await res.text();
      throw new Error(`HTTP error! status: ${res.status}, body: ${body}`);
    }
    const nfts: HeliusNft[] = await res.json();

    return (nfts || []).map((n) => {
      const imgFromLinks = n.content?.links?.image || null;
      const imgFromFiles = n.content?.files?.find((f) => !!f.uri)?.uri || null;
      const imgFromExternal = n.externalMetadata?.image || null;

      return {
        mint: n.mint,
        name: n.externalMetadata?.name || n.name || "UNKNOWN",
        image_url: imgFromLinks || imgFromFiles || imgFromExternal || null,
        collection: {
          name:
            n.externalMetadata?.collection?.name || n.collection?.name || null,
          address: n.collection?.address || null,
        },
        owner: n.owner,
        compressed: !!n.compressed,
        attributes: Array.isArray(n.externalMetadata?.attributes)
          ? n.externalMetadata?.attributes
          : [],
      } satisfies NftAsset;
    });
  } catch (error) {
    console.warn(
      `Failed to fetch NFTs for address ${sanitizeAddress(address)}: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
    return []; // Return empty array to avoid breaking the whole request
  }
}

/**
 * Fetches SOL USD price from CoinGecko API
 */
async function fetchSolUsdPrice(): Promise<number> {
  try {
    const url =
      "https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd";

    const response = await fetch(url);

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(
        `HTTP error! status: ${response.status}, body: ${errorBody}`
      );
    }

    const data: CoinGeckoPriceResponse = await response.json();
    return data.solana.usd;
  } catch (error) {
    console.warn(
      `Failed to fetch SOL USD price: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
    return 0; // Return 0 as fallback price to avoid breaking the whole request
  }
}

/**
 * Fetches wallet portfolio data using parallel API calls to Moralis
 */
export async function fetchWalletData(
  walletAddress?: string
): Promise<WalletData> {
  const apiKey = config.moralis.apiKey!;
  const baseUrl = config.moralis.baseUrl;
  const address = walletAddress || config.wallet.defaultAddress;

  if (!apiKey) throw new Error("Moralis API key is not configured");
  if (!baseUrl) throw new Error("Moralis base URL is not configured");
  if (!address) throw new Error("Wallet address is required");
  if (!isValidWalletAddress(address)) {
    throw new Error(
      `Invalid wallet address format: ${sanitizeAddress(address)}`
    );
  }

  // Check cache first
  const cacheKey = address;
  const cached = WALLET_CACHE.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.data;
  }

  try {
    // Fetch token balances, native balance, SOL price, and NFTs in parallel
    const [tokenBalances, nativeBalance, solUsdPrice, nfts] = await Promise.all(
      [
        fetchTokenBalances(address),
        fetchNativeBalance(address),
        fetchSolUsdPrice(),
        fetchNftsFromHelius(address),
      ]
    );

    // Fetch all token prices in bulk using the new Moralis service
    const tokenAddresses = tokenBalances.map((token) => token.mint);
    const tokenPricesMap = await fetchTokenPrices(tokenAddresses);

    // Process tokens with prices
    const tokens: TokenData[] = tokenBalances.map((token) => {
      const price = tokenPricesMap[token.mint];
      const amount = parseFloat(token.amount) || 0;
      const usdPrice = price?.usdPrice || 0;
      const usdValue = (amount * usdPrice).toString();

      return {
        mint: token.mint,
        symbol: token.symbol || "UNKNOWN",
        name: token.name || "UNKNOWN",
        amount_raw: token.amountRaw,
        amount: token.amount,
        usd_value: usdValue,
        logo: token.logo,
        isVerifiedContract: token.isVerifiedContract,
        possibleSpam: token.possibleSpam,
        // Additional price data for table display
        price_usd: price?.usdPrice || 0,
        price_24h_pct: price?.usdPrice24hrPercentChange ?? undefined,
        price_24h_usd_change: price?.usdPrice24hrUsdChange ?? undefined,
      };
    });

    // Calculate native SOL USD value
    const solBalance = nativeBalance.solana;
    const solUsdValue = (parseFloat(solBalance) * solUsdPrice).toFixed(2);

    const native_balance = {
      solana: solBalance,
      usd_value: solUsdValue,
    };

    // Return the wallet data in the format expected by the analytics module
    const data = {
      tokens,
      nfts, // Include fetched NFTs
      native_balance,
    };

    // Cache the result
    WALLET_CACHE.set(cacheKey, {
      data,
      expiresAt: Date.now() + CACHE_TTL_MS,
    });

    return data;
  } catch (error) {
    throw new Error(
      `Failed to fetch wallet data for address ${sanitizeAddress(address)}: ${
        error instanceof Error ? error.message : String(error)
      }`,
      { cause: error }
    );
  }
}

/**
 * Validates wallet address format
 */
export function isValidWalletAddress(address: string): boolean {
  try {
    new PublicKey(address);
    return true;
  } catch {
    return false;
  }
}

/**
 * Sanitizes wallet address for safe logging
 */
export function sanitizeAddress(address: string): string {
  if (address.length <= 8) return address;
  return `${address.slice(0, 4)}...${address.slice(-4)}`;
}
