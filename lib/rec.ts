import {
  BookOpen,
  Brain,
  Code,
  Lightbulb,
  Notebook,
  Palette,
  Sparkles,
} from "lucide-react";

export const NON_AUTH_DAILY_MESSAGE_LIMIT = 5;
export const AUTH_DAILY_MESSAGE_LIMIT = 1000;
export const REMAINING_QUERY_ALERT_THRESHOLD = 2;
export const DAILY_FILE_UPLOAD_LIMIT = 5;
export const DAILY_LIMIT_PRO_MODELS = 500;

export const NON_AUTH_ALLOWED_MODELS = ["gpt-4.1-nano"];

export const FREE_MODELS_IDS = [
  "openrouter:deepseek/deepseek-r1:free",
  "openrouter:meta-llama/llama-3.3-8b-instruct:free",
  "pixtral-large-latest",
  "mistral-large-latest",
  "gpt-4.1-nano",
];

export const MODEL_DEFAULT = "gpt-4.1-nano";
export const CHAIN_DEFAULT = "solana";

export const APP_NAME = "Chat-FE";
export const APP_DOMAIN = "https://localhost:3001";

export const SUGGESTIONS = [
  {
    label: "Transactions",
    highlight: "Show me",
    prompt: `Show me`,
    items: [
      "Show me the latest transactions for wallet...",
      "Track the status of transaction...",
      "Analyze the gas fees for transaction...",
      "Show me the largest transactions in the last 24 hours",
    ],
    icon: Notebook,
  },
  {
    label: "Tokens",
    highlight: "What is",
    prompt: `What is`,
    items: [
      "What is the current price of...",
      "Show me the top trending tokens",
      "Analyze the tokenomics of...",
      "Compare the performance of... and...",
    ],
    icon: Sparkles,
  },
  {
    label: "NFTs",
    highlight: "Show me",
    prompt: `Show me`,
    items: [
      "Show me the latest NFT mints",
      "What is the floor price of the... collection?",
      "Analyze the rarity of a specific NFT",
      "Show me the top performing NFT collections",
    ],
    icon: Palette,
  },
  {
    label: "DeFi",
    highlight: "What is",
    prompt: `What is`,
    items: [
      "What is the current APY for... on...?",
      "Show me the top DeFi protocols by TVL",
      "Analyze the risks of...",
      "Explain how... works",
    ],
    icon: BookOpen,
  },
  {
    label: "Markets",
    highlight: "What is",
    prompt: `What is`,
    items: [
      "What is the current fear and greed index?",
      "Analyze the market sentiment for...",
      "Show me the on-chain volume for...",
      "What are the key support and resistance levels for...",
    ],
    icon: Brain,
  },
  {
    label: "Developers",
    highlight: "How do I",
    prompt: `How do I`,
    items: [
      "How do I build a Solana dApp?",
      "Explain the difference between SVM and EVM",
      "Show me an example of a...",
      "What are the best practices for...",
    ],
    icon: Code,
  },
  {
    label: "Learn",
    highlight: "Explain",
    prompt: `Explain`,
    items: [
      "Explain how blockchain works",
      "What is a smart contract?",
      "What is the difference between PoW and PoS?",
      "Explain the basics of cryptography",
    ],
    icon: Lightbulb,
  },
];

export const SYSTEM_PROMPT_DEFAULT = `You are a thoughtful and clear assistant. Your tone is calm, minimal, and human. You write with intention—never too much, never too little. You avoid clichés, speak simply, and offer helpful, grounded answers. When needed, you ask good questions. You don't try to impress—you aim to clarify. You may use metaphors if they bring clarity, but you stay sharp and sincere. You're here to help the user think clearly and move forward, not to overwhelm or overperform.`;

export const MESSAGE_MAX_LENGTH = 10000;
