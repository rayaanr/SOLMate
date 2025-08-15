import { config } from "@/lib/config";
import { debugLogger } from "../utils/debug";

export interface WalletData {
  tokens: unknown[];
  nfts: unknown[];
  native_balance: {
    solana: string;
    usd_value: string;
  };
}

/**
 * Fetches wallet portfolio data from Moralis API
 */
export async function fetchWalletData(walletAddress?: string): Promise<WalletData> {
  const apiKey = config.moralis.apiKey!;
  const baseUrl = config.moralis.baseUrl;
  const address = walletAddress || config.wallet.defaultAddress;

  if (!address) {
    const error = new Error("Wallet address is required");
    debugLogger.logError('wallet_fetch', error);
    throw error;
  }

  try {
    const url = `${baseUrl}/account/mainnet/${address}/portfolio?nftMetadata=true&mediaItems=false&excludeSpam=false`;
    
    debugLogger.log('wallet_fetch', 'Fetching wallet data from Moralis API', {
      address,
      url: url.replace(apiKey, 'API_KEY_HIDDEN')
    });

    const response = await fetch(url, {
      method: "GET",
      headers: {
        accept: "application/json",
        "X-API-Key": apiKey,
      },
    });

    debugLogger.log('wallet_fetch', 'Moralis API response received', {
      status: response.status,
      statusText: response.statusText,
      ok: response.ok
    });

    if (!response.ok) {
      const error = new Error(`HTTP error! status: ${response.status}`);
      debugLogger.logError('wallet_fetch', error, { 
        status: response.status, 
        statusText: response.statusText 
      });
      throw error;
    }

    const data = await response.json();
    
    debugLogger.log('wallet_fetch', 'Successfully fetched wallet data', {
      tokensCount: data.tokens?.length || 0,
      nftsCount: data.nfts?.length || 0,
      hasNativeBalance: !!data.native_balance
    });
    
    return data;
  } catch (error) {
    debugLogger.logError('wallet_fetch', error, { address });
    throw error;
  }
}

/**
 * Validates wallet address format
 */
export function isValidWalletAddress(address: string): boolean {
  // Basic Solana address validation (44 characters, base58)
  const base58Regex = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;
  return base58Regex.test(address);
}

/**
 * Sanitizes wallet address for safe logging
 */
export function sanitizeAddress(address: string): string {
  if (address.length <= 8) return address;
  return `${address.slice(0, 4)}...${address.slice(-4)}`;
}
