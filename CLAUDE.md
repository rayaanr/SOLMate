# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Core Commands
- `bun run dev` - Start development server on localhost
- `bun run build` - Build for production
- `bun start` - Run production server
- `bun run lint` - Run ESLint checks
- `bun install` - Install dependencies

### Runtime
- Primary runtime: **Bun** (preferred over Node.js)
- Node.js 18+ also supported as fallback

## Environment Configuration

### Required Environment Variables
```bash
# Required: Helius API for NFT data and enhanced Solana RPC
HELIUS_API_KEY=your_helius_api_key_here

# Required: OpenAI API for AI assistant functionality
OPENAI_API_KEY=your_openai_api_key_here

# Required: Moralis API for additional token/wallet data
MORALIS_API_KEY=your_moralis_api_key_here

# Optional: Jupiter API for swap functionality (defaults to public endpoint)
JUPITER_API_URL=https://quote-api.jup.ag/v6
```

### Configuration Validation
- Environment validation happens in `lib/config.ts:validateConfig()`
- Missing required variables will cause startup failure with clear error messages
- Default wallet address: `kXB7FfzdrfZpAZEW3TZcp8a8CwQbsowa6BdfAHZ4gVs`

## Architecture Overview

### Core Service Layer
```
services/
├── ai/                    # AI-powered intent parsing and responses
│   ├── intent-parser.ts   # Natural language → structured intent
│   ├── ai-service.ts      # OpenAI integration
│   └── response-generator.ts
├── wallet/               # Wallet data aggregation and analytics
│   ├── wallet-service.ts  # Main orchestration service
│   ├── wallet-data.ts     # Multi-source data fetching
│   ├── wallet-analytics.ts # Portfolio insights computation
│   └── transaction-data.ts # Transaction analysis
├── market/               # Market data and price services
└── utils/                # Shared utilities and formatters
```

### Intent-Driven Architecture
The application uses an AI-powered intent parsing system:

1. **User Input** → Intent Parser (`services/ai/intent-parser.ts`)
2. **Structured Intent** → Service Router → Appropriate Service
3. **Data Fetching** → Analytics Engine → Insights
4. **AI Response** → Frontend Components → Rich UI

### Intent Types
- **Query Intents**: `portfolio`, `balances`, `nfts`, `transactions`, `market`, `prices`, `gainers`, `losers`
- **Action Intents**: `transfer`, `deposit`, `swap`, `stake`, `unstake`, `nft_transfer`
- **Data Sources**: Helius (NFTs), Moralis (tokens), OpenAI (AI responses)

### Frontend Components
```
components/
├── chat/                 # Message rendering and chat UI
├── nfts/                 # NFT grid displays with lazy loading
├── portfolio/            # Portfolio visualization tables
├── market/              # Market data components
├── solana-pay/          # Payment QR codes and requests
└── prompt-kit/          # AI chat interface components
```

### Data Flow Pattern
1. **Message Preprocessing**: Keyword enhancement for better intent recognition
2. **Intent Classification**: GPT-4o-mini converts natural language to structured JSON
3. **Service Dispatch**: Router calls appropriate wallet/market/action services
4. **Data Aggregation**: Multi-API data fetching with error handling
5. **Analytics Processing**: Statistical insights and trend analysis
6. **Response Generation**: AI-generated natural language + structured data blocks
7. **Component Rendering**: Rich UI components for portfolios, NFTs, transactions

### Special Data Blocks
The app uses embedded data blocks in AI responses:
- `[NFT_DATA]` - Triggers NFTCard grid rendering
- `[PORTFOLIO_DATA]` - Triggers portfolio table display
- `[TRANSACTION_DATA]` - Triggers transaction history table
- `[MARKET_DATA]` - Triggers market analysis components

### NFT Integration
- **Collection Analytics**: Top collections by count/percentage
- **Compressed NFT Detection**: cNFT ratio analysis
- **Visual Components**: Lazy-loaded image grids with error handling
- **Data Structure**: Helius API integration with collection metadata

## Code Conventions

### TypeScript Configuration
- Strict mode enabled
- Path aliases: `@/*` → project root
- Target: ES2017 with DOM libraries

### ESLint Rules
- `@typescript-eslint/no-explicit-any`: warn
- `@typescript-eslint/no-unused-vars`: warn
- `react/no-unescaped-entities`: off
- `prefer-const`: warn

### Image Optimization
Next.js image optimization configured for:
- Remote patterns: CoinGecko, GitHub, Arweave, Moralis
- WebP format prioritization
- 7-day cache TTL
- SVG support with CSP sandbox

### Testing Approach
- Manual testing scenarios documented in README.md
- Focus on intent recognition accuracy
- Error handling for missing API keys, empty wallets, broken images
- Portfolio and NFT query variations

## Key Integration Points

### API Endpoints
- **Helius**: `https://api.helius.xyz/v0/addresses/{address}/nfts`
- **Moralis**: Token balances and wallet analytics via Solana gateway
- **OpenAI**: GPT-4 and GPT-4o-mini for intent parsing and responses
- **Jupiter**: DEX aggregation for swap functionality

### Wallet Integration
- Solana wallet adapter support (Phantom, Solflare, etc.)
- Web3Auth modal integration
- Address validation and sanitization
- Fallback address for testing: `kXB7FfzdrfZpAZEW3TZcp8a8CwQbsowa6BdfAHZ4gVs`

### State Management
- React Query for server state management
- Context providers for wallet connection
- Optimized data fetching with caching strategies

When working on this codebase, always validate environment configuration first, understand the intent-driven architecture, and test with the provided fallback wallet address for development.