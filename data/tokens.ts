/**
 * Centralized token configuration for SOLMate
 * Contains all supported tokens with their mint addresses, symbols, and decimals
 */

export interface TokenConfig {
  address: string;
  symbol: string;
  decimals: number;
}

export interface TokenConfigWithMint {
  mint: string;
  symbol: string;
  decimals: number;
}

// Comprehensive token configurations
export const TOKENS = {
  SOL: { 
    address: 'So11111111111111111111111111111111111111112', 
    symbol: 'SOL', 
    decimals: 9 
  },
  USDC: { 
    address: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', 
    symbol: 'USDC', 
    decimals: 6 
  },
  USDT: { 
    address: 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB', 
    symbol: 'USDT', 
    decimals: 6 
  },
  BONK: { 
    address: 'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263', 
    symbol: 'BONK', 
    decimals: 5 
  },
  RAY: { 
    address: '4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R', 
    symbol: 'RAY', 
    decimals: 6 
  },
  ONESOL: { 
    address: '4ThReWAbAVZjNVgs5Ui9Pk3cZ5TYaD9u6Y89fp6EFzoF', 
    symbol: 'ONESOL', 
    decimals: 8 
  },
} as const;

// AI Service compatible format (uses 'mint' instead of 'address')
export const TOKEN_CONFIGS: Record<string, TokenConfigWithMint> = {
  USDC: {
    mint: TOKENS.USDC.address,
    symbol: TOKENS.USDC.symbol,
    decimals: TOKENS.USDC.decimals,
  },
  USDT: {
    mint: TOKENS.USDT.address,
    symbol: TOKENS.USDT.symbol,
    decimals: TOKENS.USDT.decimals,
  },
  BONK: {
    mint: TOKENS.BONK.address,
    symbol: TOKENS.BONK.symbol,
    decimals: TOKENS.BONK.decimals,
  },
  RAY: {
    mint: TOKENS.RAY.address,
    symbol: TOKENS.RAY.symbol,
    decimals: TOKENS.RAY.decimals,
  },
  ONESOL: {
    mint: TOKENS.ONESOL.address,
    symbol: TOKENS.ONESOL.symbol,
    decimals: TOKENS.ONESOL.decimals,
  },
};

// Utility functions
export function getTokenBySymbol(symbol: string): TokenConfig | undefined {
  const upperSymbol = symbol.toUpperCase() as keyof typeof TOKENS;
  return TOKENS[upperSymbol];
}

export function getTokenMintBySymbol(symbol: string): string {
  const config = TOKEN_CONFIGS[symbol.toUpperCase()];
  if (!config) {
    throw new Error(`Unsupported token: ${symbol}`);
  }
  return config.mint;
}

export function getTokenDecimalsBySymbol(symbol: string): number {
  const config = TOKEN_CONFIGS[symbol.toUpperCase()];
  if (!config) {
    throw new Error(`Unsupported token: ${symbol}`);
  }
  return config.decimals;
}

export function isTokenSupported(symbol: string): boolean {
  return symbol.toUpperCase() in TOKENS;
}

export const SUPPORTED_TOKENS = Object.keys(TOKENS);
export const SUPPORTED_TOKEN_SYMBOLS = SUPPORTED_TOKENS;
