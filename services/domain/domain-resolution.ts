import { Connection, PublicKey } from "@solana/web3.js";
import { resolve, getDomainKeySync } from "@bonfida/spl-name-service";
import { useSolanaConnection } from "@/providers/SolanaRPCProvider";

// In-memory cache for domain resolution results
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes
type CacheEntry = { address: string; expiresAt: number };
const DOMAIN_CACHE = new Map<string, CacheEntry>();

/**
 * Interface for domain resolution results
 */
export interface DomainResolutionResult {
  domain: string;
  address: string;
  isResolved: boolean;
}

/**
 * Checks if a string is a Solana domain (.sol extension)
 */
export function isSolanaDomain(input: string): boolean {
  if (!input || typeof input !== 'string') return false;
  return input.trim().toLowerCase().endsWith('.sol');
}

/**
 * Checks if a string is a valid Solana wallet address
 */
export function isValidWalletAddress(address: string): boolean {
  try {
    if (!address || typeof address !== 'string') return false;
    new PublicKey(address);
    return true;
  } catch {
    return false;
  }
}

/**
 * Resolves a .sol domain to a wallet address
 */
export async function resolveSolanaDomain(
  domain: string,
  connection?: Connection
): Promise<string> {
  if (!isSolanaDomain(domain)) {
    throw new Error(`Invalid domain format: ${domain}. Must end with .sol`);
  }

  const cleanDomain = domain.trim().toLowerCase();
  
  // Check cache first
  const cached = DOMAIN_CACHE.get(cleanDomain);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.address;
  }

  try {
    // Remove .sol extension for resolution
    const domainName = cleanDomain.replace('.sol', '');
    
    // Use provided connection or get default
    let rpcConnection: Connection;
    if (connection) {
      rpcConnection = connection;
    } else {
      // We'll need to get connection from context or create one
      rpcConnection = new Connection(
        process.env.NEXT_PUBLIC_HELIUS_RPC_URL || 
        'https://api.mainnet-beta.solana.com'
      );
    }

    // Get domain key
    const { pubkey: domainKey } = getDomainKeySync(domainName);
    
    // Resolve domain to address
    const owner = await resolve(rpcConnection, domainName);
    
    if (!owner) {
      throw new Error(`Domain ${domain} not found or not registered`);
    }

    const resolvedAddress = owner.toString();

    // Cache the result
    DOMAIN_CACHE.set(cleanDomain, {
      address: resolvedAddress,
      expiresAt: Date.now() + CACHE_TTL_MS
    });

    return resolvedAddress;

  } catch (error) {
    console.error(`Failed to resolve domain ${domain}:`, error);
    throw new Error(
      `Failed to resolve domain ${domain}: ${
        error instanceof Error ? error.message : 'Unknown error'
      }`
    );
  }
}

/**
 * Resolves a recipient (domain or address) to a wallet address
 * If already an address, returns as-is. If a domain, resolves it.
 */
export async function resolveRecipient(
  recipient: string,
  connection?: Connection
): Promise<DomainResolutionResult> {
  const cleanRecipient = recipient.trim();

  // If it's already a valid wallet address, return as-is
  if (isValidWalletAddress(cleanRecipient)) {
    return {
      domain: '',
      address: cleanRecipient,
      isResolved: false
    };
  }

  // If it's a domain, resolve it
  if (isSolanaDomain(cleanRecipient)) {
    try {
      const resolvedAddress = await resolveSolanaDomain(cleanRecipient, connection);
      return {
        domain: cleanRecipient,
        address: resolvedAddress,
        isResolved: true
      };
    } catch (error) {
      throw error; // Re-throw to let caller handle
    }
  }

  // Invalid format
  throw new Error(
    `Invalid recipient format: ${recipient}. Must be a valid wallet address or .sol domain`
  );
}

/**
 * Validates a recipient (either wallet address or .sol domain)
 */
export function isValidRecipient(recipient: string): boolean {
  if (!recipient || typeof recipient !== 'string') return false;
  
  const cleanRecipient = recipient.trim();
  
  // Check if it's a valid wallet address
  if (isValidWalletAddress(cleanRecipient)) return true;
  
  // Check if it's a valid domain format
  if (isSolanaDomain(cleanRecipient)) return true;
  
  return false;
}

/**
 * Batch resolve multiple domains/recipients
 */
export interface DomainResolutionResult {
  domain: string;
  address: string;
  isResolved: boolean;
  error?: string;
}

export async function batchResolveRecipients(
  recipients: string[],
  connection?: Connection
): Promise<DomainResolutionResult[]> {
  const promises = recipients.map(async (recipient) => {
    try {
      return await resolveRecipient(recipient, connection);
    } catch (error) {
      return {
        domain: isSolanaDomain(recipient) ? recipient : '',
        address: '',
        isResolved: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  });

  return Promise.all(promises);
}

/**
 * Clears the domain resolution cache
 */
export function clearDomainCache(): void {
  DOMAIN_CACHE.clear();
}

/**
 * Gets current cache size (for debugging)
 */
export function getDomainCacheSize(): number {
  return DOMAIN_CACHE.size;
}

/**
 * React hook for resolving domains in client components
 */
export function useResolveDomain() {
  // This will use the centralized Solana connection
  
  const resolveDomain = async (domain: string) => {
    const connection = new Connection(
      process.env.NEXT_PUBLIC_HELIUS_RPC_URL || 
      'https://api.mainnet-beta.solana.com'
    );
    return resolveSolanaDomain(domain, connection);
  };

  const resolveRecipientHook = async (recipient: string) => {
    const connection = new Connection(
      process.env.NEXT_PUBLIC_HELIUS_RPC_URL || 
      'https://api.mainnet-beta.solana.com'
    );
    return resolveRecipient(recipient, connection);
  };

  return {
    resolveDomain,
    resolveRecipient: resolveRecipientHook,
    isValidRecipient,
    isSolanaDomain,
    isValidWalletAddress
  };
}
