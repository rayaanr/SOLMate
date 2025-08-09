// Environment configuration
export const config = {
  openai: {
    apiKey: process.env.OPENAI_API_KEY,
  },
  moralis: {
    apiKey: process.env.MORALIS_API_KEY,
    baseUrl: "https://solana-gateway.moralis.io",
  },
  wallet: {
    defaultAddress: process.env.WALLET_ADDRESS,
  },
} as const;

// Validate required environment variables
export function validateConfig() {
  const required = {
    OPENAI_API_KEY: config.openai.apiKey,
    MORALIS_API_KEY: config.moralis.apiKey,
    WALLET_ADDRESS: config.wallet.defaultAddress,
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
