// Environment configuration
export const config = {
  openai: {
    apiKey: process.env.OPENAI_API_KEY,
  },
  moralis: {
    apiKey: process.env.MORALIS_API_KEY,
    baseUrl: "https://solana-gateway.moralis.io",
  },
  helius: {
    apiKey: process.env.HELIUS_API_KEY,
    baseUrl: "https://api.helius.xyz/v0",
  },
  wallet: {
    defaultAddress: "kXB7FfzdrfZpAZEW3TZcp8a8CwQbsowa6BdfAHZ4gVs",
  },
} as const;

// Validate required environment variables
export function validateConfig() {
  const required = {
    OPENAI_API_KEY: config.openai.apiKey,
    MORALIS_API_KEY: config.moralis.apiKey,
    HELIUS_API_KEY: config.helius.apiKey,
    WALLET_ADDRESS: "kXB7FfzdrfZpAZEW3TZcp8a8CwQbsowa6BdfAHZ4gVs",
  };

  const missing = Object.entries(required)
    .filter(([, value]) => !value)
    .map(([key]) => key);

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(", ")}`
    );
  }
}
