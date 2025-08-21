/**
 * Centralized token configuration for SOLMate
 * Contains all supported tokens with their mint addresses, symbols, and decimals
 */

export interface TokenInfo {
  address: string;
  symbol: string;
  decimals: number;
}

export interface TokenMintInfo {
  mint: string;
  symbol: string;
  decimals: number;
}

// Comprehensive token configurations
export const TOKENS = {
  SOL: {
    address: "So11111111111111111111111111111111111111112",
    symbol: "SOL",
    decimals: 9,
  },
  USDC: {
    address: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
    symbol: "USDC",
    decimals: 6,
  },
  USDT: {
    address: "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB",
    symbol: "USDT",
    decimals: 6,
  },
  BONK: {
    address: "DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263",
    symbol: "BONK",
    decimals: 5,
  },
  RAY: {
    address: "4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R",
    symbol: "RAY",
    decimals: 6,
  },
  ONESOL: {
    address: "4ThReWAbAVZjNVgs5Ui9Pk3cZ5TYaD9u6Y89fp6EFzoF",
    symbol: "ONESOL",
    decimals: 8,
  },
} as const;

// AI Service compatible format (uses 'mint' instead of 'address')
export const TOKEN_CONFIGS: Record<string, TokenMintInfo> = Object.entries(
  TOKENS
)
  .filter(([key]) => key !== "SOL") // Exclude SOL if it shouldn't be in TOKEN_CONFIGS
  .reduce((acc, [key, token]) => {
    acc[key] = {
      mint: token.address,
      symbol: token.symbol,
      decimals: token.decimals,
    };
    return acc;
  }, {} as Record<string, TokenMintInfo>);

// Utility functions
export function getTokenBySymbol(symbol: string): TokenInfo | undefined {
  const upperSymbol = symbol.toUpperCase() as keyof typeof TOKENS;
  return TOKENS[upperSymbol];
}

export function getTokenMintBySymbol(symbol: string): string {
  const upperSymbol = symbol.toUpperCase();
  if (upperSymbol === "SOL") return TOKENS.SOL.address;

  const config = TOKEN_CONFIGS[symbol.toUpperCase()];
  if (!config) {
    throw new Error(`Unsupported token: ${symbol}`);
  }
  return config.mint;
}

export function getTokenDecimalsBySymbol(symbol: string): number {
  const upper = symbol.toUpperCase();
  if (upper === "SOL") {
    return TOKENS.SOL.decimals;
  }
  const config = TOKEN_CONFIGS[upper as keyof typeof TOKEN_CONFIGS];
  if (!config) {
    throw new Error(`Unsupported token: ${symbol}`);
  }
  return config.decimals;
}

export function isTokenSupported(symbol: string): boolean {
  return symbol.toUpperCase() in TOKENS;
}

// Create a reverse mapping from mint address to symbol
export const MINT_TO_SYMBOL_MAP: Record<string, string> = Object.values(
  TOKENS
).reduce((acc, token) => {
  acc[token.address] = token.symbol;
  return acc;
}, {} as Record<string, string>);

export function getTokenSymbolByMint(mint: string | undefined | null): string {
  if (!mint) return "SOL";
  const normalizedMint = mint.trim();
  if (!normalizedMint) return "SOL";
  return MINT_TO_SYMBOL_MAP[normalizedMint] || "Unknown";
}

export const SUPPORTED_TOKENS = Object.keys(TOKENS);
export const SUPPORTED_TOKEN_SYMBOLS = SUPPORTED_TOKENS;
