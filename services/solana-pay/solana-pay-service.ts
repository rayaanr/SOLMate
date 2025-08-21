import { PublicKey, Connection, Keypair } from "@solana/web3.js";
import { 
  encodeURL, 
  parseURL,
  findReference,
  TransferRequestURL,
  TransactionRequestURL,
  FindReferenceError
} from "@solana/pay";
import QRCode from "qrcode";
import BigNumber from "bignumber.js";

// In-memory cache for payment requests
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes
type PaymentCacheEntry = { 
  request: SolanaPayRequest; 
  reference: PublicKey;
  expiresAt: number; 
};
const PAYMENT_CACHE = new Map<string, PaymentCacheEntry>();

/**
 * Solana Pay request configuration
 */
export interface SolanaPayRequest {
  recipient: PublicKey;
  amount: number;
  splToken?: PublicKey; // For SPL token payments
  reference?: PublicKey;
  label?: string;
  message?: string;
  memo?: string;
}

/**
 * Payment status tracking
 */
export interface PaymentStatus {
  status: 'pending' | 'confirmed' | 'failed' | 'expired';
  signature?: string;
  confirmations?: number;
  error?: string;
  timestamp: number;
}

/**
 * Payment history entry
 */
export interface PaymentHistoryEntry {
  id: string;
  recipient: string;
  amount: number;
  token?: string;
  status: PaymentStatus['status'];
  signature?: string;
  timestamp: number;
  qrCodeUrl?: string;
  solanaPayUrl: string;
}

/**
 * Quick deposit preset amounts
 */
export const QUICK_DEPOSIT_PRESETS = [
  { label: "0.1 SOL", amount: 0.1, token: null },
  { label: "0.5 SOL", amount: 0.5, token: null },
  { label: "1 SOL", amount: 1, token: null },
  { label: "5 SOL", amount: 5, token: null },
  { label: "10 USDC", amount: 10, token: "USDC" },
  { label: "50 USDC", amount: 50, token: "USDC" },
  { label: "100 USDC", amount: 100, token: "USDC" },
  { label: "500 USDC", amount: 500, token: "USDC" },
];

/**
 * Well-known SPL token mints
 */
const SPL_TOKEN_MINTS: Record<string, string> = {
  "USDC": "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
  "USDT": "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB",
  "RAY": "4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R",
  "SRM": "SRMuApVNdxXokk5GT7XD5cUUgXMBCoAz2LHeuAoKWRt"
};

/**
 * Creates a Solana Pay payment request
 */
export async function createPaymentRequest(
  config: SolanaPayRequest
): Promise<{
  url: URL;
  qrCode: string;
  reference: PublicKey;
  id: string;
}> {
  try {
    // Generate a unique reference for tracking
    const reference = config.reference || Keypair.generate().publicKey;
    
    // Create the payment URL
    const url = encodeURL({
      recipient: config.recipient,
      amount: new BigNumber(config.amount),
      splToken: config.splToken,
      reference,
      label: config.label,
      message: config.message,
      memo: config.memo,
    });

    // Generate QR code
    const qrCode = await QRCode.toDataURL(url.toString(), {
      errorCorrectionLevel: 'M',
      margin: 1,
      color: {
        dark: '#000000',
        light: '#FFFFFF',
      },
      width: 256,
    });

    // Generate unique ID for this payment request
    const id = reference.toBase58();

    // Cache the payment request
    PAYMENT_CACHE.set(id, {
      request: { ...config, reference },
      reference,
      expiresAt: Date.now() + CACHE_TTL_MS
    });

    return {
      url,
      qrCode,
      reference,
      id
    };

  } catch (error) {
    console.error("Failed to create payment request:", error);
    throw new Error(
      `Failed to create payment request: ${
        error instanceof Error ? error.message : 'Unknown error'
      }`
    );
  }
}

/**
 * Creates a quick deposit request for common amounts
 */
export async function createQuickDepositRequest(
  recipientAddress: string,
  amount: number,
  tokenSymbol?: string,
  label?: string
): Promise<{
  url: URL;
  qrCode: string;
  reference: PublicKey;
  id: string;
}> {
  const recipient = new PublicKey(recipientAddress);

  if (!isFinite(amount) || amount <= 0) {
    throw new Error(`Invalid amount: ${amount}. Please provide a positive number.`);
  }

  let splToken: PublicKey | undefined;
  if (tokenSymbol && SPL_TOKEN_MINTS[tokenSymbol]) {
    splToken = new PublicKey(SPL_TOKEN_MINTS[tokenSymbol]);
  } else throw new Error(`Unsupported token: ${tokenSymbol}`);

  return createPaymentRequest({
    recipient,
    amount,
    splToken,
    label: label || `Quick Deposit: ${amount} ${tokenSymbol || 'SOL'}`,
    message: `Deposit ${amount} ${tokenSymbol || 'SOL'} to your wallet`,
    memo: `SOLMate quick deposit: ${amount} ${tokenSymbol || 'SOL'}`
  });
}

/**
 * Validates a payment URL
 */
export function validatePaymentURL(url: string): {
  isValid: boolean;
  parsed?: TransferRequestURL | TransactionRequestURL;
  error?: string;
} {
  try {
    const parsed = parseURL(url);
    return {
      isValid: true,
      parsed
    };
  } catch (error) {
    return {
      isValid: false,
      error: error instanceof Error ? error.message : 'Invalid URL'
    };
  }
}

/**
 * Tracks payment status using the reference
 */

export async function trackPaymentStatus(
  connection: Connection,
  reference: PublicKey,
  options: {
    finality?: 'finalized' | 'confirmed';
    timeout?: number;
  } = {}
): Promise<PaymentStatus> {
  const { finality = 'confirmed', timeout = 30000 } = options;

  try {
    // Check if payment is confirmed
    const response = await findReference(connection, reference, {
      finality
    });

    if (response.signature) {
      return {
        status: 'confirmed',
        signature: response.signature,
        timestamp: Date.now()
      };
    }

    return {
      status: 'pending',
      timestamp: Date.now()
    };

  } catch (error) {
    // Not found yet -> still pending
    if (error instanceof FindReferenceError) {
      return {
        status: 'pending',
        timestamp: Date.now(),
      };
    }
    // Other unexpected errors
    return {
      status: 'failed',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: Date.now(),
    };
  }
}

/**
 * Continuously monitors payment status
 */
export function monitorPaymentStatus(
  connection: Connection,
  reference: PublicKey,
  onStatusUpdate: (status: PaymentStatus) => void,
  options: {
    interval?: number;
    maxAttempts?: number;
    finality?: 'finalized' | 'confirmed';
  } = {}
): () => void {
  const { interval = 3000, maxAttempts = 100, finality = 'confirmed' } = options;
  let attempts = 0;
  let isMonitoring = true;

  const monitor = async () => {
    if (!isMonitoring || attempts >= maxAttempts) {
      onStatusUpdate({
        status: 'expired',
        timestamp: Date.now()
      });
      return;
    }

    attempts++;

    try {
      const status = await trackPaymentStatus(connection, reference, { finality });
      onStatusUpdate(status);

      if (status.status === 'confirmed' || status.status === 'failed') {
        isMonitoring = false;
        return;
      }

      // Continue monitoring if still pending
      if (isMonitoring) {
        setTimeout(monitor, interval);
      }
    } catch (error) {
      onStatusUpdate({
        status: 'failed',
        error: error instanceof Error ? error.message : 'Monitoring error',
        timestamp: Date.now()
      });
      isMonitoring = false;
    }
  };

  // Start monitoring
  monitor();

  // Return stop function
  return () => {
    isMonitoring = false;
  };
}

/**
 * Gets cached payment request by ID
 */
export function getPaymentRequest(id: string): PaymentCacheEntry | null {
  const cached = PAYMENT_CACHE.get(id);
  if (cached && cached.expiresAt > Date.now()) {
    return cached;
  }
  
  // Clean up expired entry
  if (cached) {
    PAYMENT_CACHE.delete(id);
  }
  
  return null;
}

/**
 * Gets all cached payment requests (for history)
 */
export function getAllPaymentRequests(): PaymentHistoryEntry[] {
  const entries: PaymentHistoryEntry[] = [];
  
  PAYMENT_CACHE.forEach((cached, id) => {
    if (cached.expiresAt > Date.now()) {
      entries.push({
        id,
        recipient: cached.request.recipient.toString(),
        amount: cached.request.amount,
        token: cached.request.splToken?.toString(),
        status: 'pending', // Would need to check actual status
        timestamp: cached.expiresAt - CACHE_TTL_MS,
        solanaPayUrl: encodeURL({
          recipient: cached.request.recipient,
          amount: new BigNumber(cached.request.amount),
          splToken: cached.request.splToken,
          reference: cached.reference,
          label: cached.request.label,
          message: cached.request.message,
          memo: cached.request.memo,
        }).toString()
      });
    }
  });

  return entries.sort((a, b) => b.timestamp - a.timestamp);
}

/**
 * Clears expired payment requests from cache
 */
export function clearExpiredPaymentRequests(): number {
  let cleared = 0;
  const now = Date.now();

  PAYMENT_CACHE.forEach((cached, id) => {
    if (cached.expiresAt <= now) {
      PAYMENT_CACHE.delete(id);
      cleared++;
    }
  });

  return cleared;
}

/**
 * Gets payment cache statistics
 */
export function getPaymentCacheStats(): {
  total: number;
  active: number;
  expired: number;
} {
  const now = Date.now();
  let active = 0;
  let expired = 0;

  PAYMENT_CACHE.forEach((cached) => {
    if (cached.expiresAt > now) {
      active++;
    } else {
      expired++;
    }
  });

  return {
    total: PAYMENT_CACHE.size,
    active,
    expired
  };
}

/**
 * Generates a deep link for mobile wallet integration
 */
export function generateDeepLink(
  paymentUrl: string,
  walletApp: 'phantom' | 'solflare' | 'glow' = 'phantom'
): string {
  const encodedUrl = encodeURIComponent(paymentUrl);
  
  switch (walletApp) {
    case 'phantom':
      return `https://phantom.app/ul/v1/browse?url=${encodedUrl}`;
    case 'solflare':
      return `https://solflare.com/ul/v1/browse/${encodedUrl}`;
    case 'glow':
      return `solana:${encodedUrl}`;
    default:
      return paymentUrl;
  }
}

/**
 * Validates if an address is a valid Solana public key
 */
export function isValidSolanaAddress(address: string): boolean {
  try {
    new PublicKey(address);
    return true;
  } catch {
    return false;
  }
}
