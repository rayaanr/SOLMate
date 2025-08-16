import { config } from "@/lib/config";
import { PublicKey } from "@solana/web3.js";

// Main WalletData interface (public API - stays compatible with analytics module)
export interface WalletData {
  tokens: TokenData[];
  nfts: unknown[];
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

// Moralis token price endpoint response (/token/mainnet/{mint}/price)
export interface MoralisTokenPrice {
  tokenAddress: string;
  pairAddress: string;
  exchangeName: string;
  exchangeAddress: string;
  nativePrice: {
    value: string;
    symbol: string;
    name: string;
    decimals: number;
  };
  usdPrice: number;
  usdPrice24h: number;
  usdPrice24hrUsdChange: number;
  usdPrice24hrPercentChange: number;
  logo: string;
  name: string;
  symbol: string;
  isVerifiedContract: boolean;
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
}

/**
 * Fetches token balances from Moralis API
 */
async function fetchTokenBalances(address: string): Promise<MoralisTokenBalance[]> {
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
      `Failed to fetch token balances for address ${sanitizeAddress(address)}: ${
        error instanceof Error ? error.message : String(error)
      }`,
      { cause: error }
    );
  }
}

/**
 * Fetches token price from Moralis API
 */
async function fetchTokenPrice(mintAddress: string): Promise<MoralisTokenPrice | null> {
  const apiKey = config.moralis.apiKey!;
  const baseUrl = config.moralis.baseUrl;

  try {
    const url = `${baseUrl}/token/mainnet/${mintAddress}/price`;

    const response = await fetch(url, {
      method: "GET",
      headers: {
        accept: "application/json",
        "X-API-Key": apiKey,
      },
    });

    // If token price is not available, return null instead of throwing an error
    if (response.status === 404) {
      return null;
    }

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(
        `HTTP error! status: ${response.status}, body: ${errorBody}`
      );
    }

    return await response.json();
  } catch (error) {
    console.warn(`Failed to fetch price for token ${mintAddress}: ${error instanceof Error ? error.message : String(error)}`);
    return null; // Return null for failed price fetches to avoid breaking the whole request
  }
}

/**
 * Fetches native SOL balance from Moralis API
 */
async function fetchNativeBalance(address: string): Promise<MoralisNativeBalance> {
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
      `Failed to fetch native SOL balance for address ${sanitizeAddress(address)}: ${
        error instanceof Error ? error.message : String(error)
      }`,
      { cause: error }
    );
  }
}

/**
 * Fetches SOL USD price from CoinGecko API
 */
async function fetchSolUsdPrice(): Promise<number> {
  try {
    const url = "https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd";

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
    console.warn(`Failed to fetch SOL USD price: ${error instanceof Error ? error.message : String(error)}`);
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

  try {
    // Fetch token balances, native balance, and SOL price in parallel
    const [tokenBalances, nativeBalance, solUsdPrice] = await Promise.all([
      fetchTokenBalances(address),
      fetchNativeBalance(address),
      fetchSolUsdPrice()
    ]);

    // Fetch token prices in parallel
    const tokenPricePromises = tokenBalances.map(token => fetchTokenPrice(token.mint));
    const tokenPrices = await Promise.all(tokenPricePromises);

    // Process tokens with prices
    const tokens: TokenData[] = tokenBalances.map((token, index) => {
      const price = tokenPrices[index];
      const amount = parseFloat(token.amount) || 0;
      const usdPrice = price?.usdPrice || 0;
      const usdValue = (amount * usdPrice).toString();

      return {
        mint: token.mint,
        symbol: token.symbol || 'UNKNOWN',
        name: token.name || 'UNKNOWN',
        amount_raw: token.amountRaw,
        amount: token.amount,
        usd_value: usdValue,
        logo: token.logo,
        isVerifiedContract: token.isVerifiedContract,
        possibleSpam: token.possibleSpam
      };
    });

    // Calculate native SOL USD value
    const solBalance = nativeBalance.solana;
    const solUsdValue = (parseFloat(solBalance) * solUsdPrice).toFixed(2);

    const native_balance = {
      solana: solBalance,
      usd_value: solUsdValue
    };

    // Return the wallet data in the format expected by the analytics module
    return {
      tokens,
      nfts: [], // Empty array as per current implementation
      native_balance
    };
  } catch (error) {
    throw new Error(
      `Failed to fetch wallet data for address ${sanitizeAddress(
        address
      )}: ${
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
