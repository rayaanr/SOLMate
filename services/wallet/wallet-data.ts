import { config } from "@/lib/config";
import { PublicKey } from "@solana/web3.js";

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
export async function fetchWalletData(
  walletAddress?: string
): Promise<WalletData> {
  const apiKey = config.moralis.apiKey!;
  const baseUrl = config.moralis.baseUrl;
  const address = walletAddress || config.wallet.defaultAddress;

  if (!address) {
    const error = new Error("Wallet address is required");
    throw error;
  }

  try {
    const url = `${baseUrl}/account/mainnet/${address}/portfolio?nftMetadata=true&mediaItems=false&excludeSpam=false`;

    const response = await fetch(url, {
      method: "GET",
      headers: {
        accept: "application/json",
        "X-API-Key": apiKey,
      },
    });

    if (!response.ok) {
      const error = new Error(`HTTP error! status: ${response.status}`);
      throw error;
    }

    const data = await response.json();

    return data;
  } catch (error) {
    throw error;
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
