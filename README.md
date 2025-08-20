# SOLMate

**AI-Powered Solana Wallet Analytics & Assistant**

SOLMate is an intelligent Solana wallet analysis tool that combines AI-driven natural language querying with comprehensive on-chain data analytics. It provides users with deep insights into their wallet portfolios, NFT collections, transaction history, and trading patterns through an intuitive chat interface.

## ✨ Features

### 🔍 **Wallet Analytics**
- **Portfolio Overview**: Real-time token balances, USD values, and portfolio diversification metrics
- **NFT Analytics**: Complete NFT collection analysis with compressed NFT detection and collection statistics
- **Transaction History**: Detailed transaction analysis with filtering capabilities
- **AI-Powered Insights**: Natural language queries for complex wallet analytics

### 🤖 **AI Assistant**
- **Intent Recognition**: Smart parsing of user queries ("show my NFTs", "portfolio overview", etc.)
- **Conversational Interface**: Natural language interaction for wallet management
- **Data Visualization**: Rich UI components for displaying portfolio and NFT data

### 🖼️ **NFT Integration**
- **Visual NFT Gallery**: Grid layout with image lazy loading and error handling
- **Collection Analytics**: Top collections, compressed NFT ratios, and ownership statistics
- **[NFT_DATA] Embedding**: Special data blocks for seamless frontend NFT rendering

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ or Bun runtime
- Solana wallet address for testing
- Required API keys (see Environment Setup)

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd SOLMate

# Install dependencies
bun install

# Set up environment variables (see below)
cp .env.example .env.local

# Start the development server
bun run dev
```

### Environment Setup

Create a `.env.local` file with the following required variables:

```bash
# Required: Helius API for NFT data and enhanced Solana RPC
HELIUS_API_KEY=your_helius_api_key_here

# Required: OpenAI API for AI assistant functionality
OPENAI_API_KEY=your_openai_api_key_here

# Required: Moralis API for additional token/wallet data
MORGAN_API_KEY=your_moralis_api_key_here

# Optional: Jupiter API for swap functionality
JUPITER_API_URL=https://quote-api.jup.ag/v6
```

**API Endpoints:**
- **Helius**: Uses `https://api.helius.xyz/v0` for NFT data via `/addresses/{address}/nfts`
- **Moralis**: Token balances and wallet analytics
- **OpenAI**: GPT-4 for intent parsing and conversational AI

### Development Commands

```bash
# Start development server
bun run dev

# Build for production
bun run build

# Run production server
bun start

# Lint code
bun run lint
```

Open [http://localhost:3000](http://localhost:3000) to see the application.

## 🏗️ Architecture

### Core Services

- **`services/wallet/`**: Wallet data fetching and analytics
  - `wallet-data.ts`: Multi-source data aggregation (Moralis + Helius)
  - `wallet-analytics.ts`: Portfolio and NFT analytics computation
  - `wallet-service.ts`: High-level wallet operations

- **`services/ai/`**: AI-powered features
  - `intent-parser.ts`: Natural language query classification
  - `ai-service.ts`: OpenAI integration and response generation

### Frontend Components

- **`components/chat/`**: Chat interface and message rendering
- **`components/nfts/`**: NFT display components (cards, grids)
- **`components/portfolio/`**: Portfolio visualization components
- **`services/utils/`**: Message parsing and data utilities

### Data Flow

1. **User Query** → Intent Parser → Structured Intent
2. **Intent** → Wallet Service → Data Fetching (Helius/Moralis)
3. **Raw Data** → Analytics Engine → Insights & Metrics
4. **Processed Data** → AI Assistant → Conversational Response
5. **Response** → Frontend → Rich UI Components ([NFT_DATA], tables, etc.)

## 💎 NFT Integration Details

### NFT Data Structure
```typescript
interface NftAsset {
  mint: string;
  name: string;
  image_url: string | null;
  collection?: {
    name?: string | null;
    address?: string | null;
  };
  owner?: string;
  compressed?: boolean; // cNFT detection
  attributes?: Array<{ trait_type?: string; value?: string | number }>;
}
```

### NFT Analytics
- **Collection Statistics**: Top collections by count and percentage
- **Compressed NFT Ratio**: Percentage of cNFTs in portfolio
- **Portfolio Integration**: NFT metrics included in overall portfolio analytics

### UI Components
- **NFTCard**: Individual NFT display with lazy loading and error handling
- **MessageNFTGrid**: Responsive grid layout for NFT collections
- **Loading States**: Purple-themed skeleton loaders for NFT preparation

## 🔧 Configuration

The application uses a centralized configuration system in `lib/config.ts` with validation:

```typescript
// Configuration validation on startup
validateConfig(); // Ensures all required API keys are present
```

## 🧪 Testing

### Manual Test Scenarios

1. **NFT Queries**:
   - "Show my NFTs" → NFT grid with analytics
   - "How many NFTs do I have?" → Count and collection breakdown
   - "My collectibles gallery" → Visual NFT display

2. **Portfolio Queries**:
   - "Portfolio overview" → Complete wallet analytics
   - "Token balances" → Token holdings table
   - "Transaction history" → Recent activity

3. **Error Handling**:
   - Missing API keys → Early validation failure
   - Empty wallets → Graceful "No data" messages
   - Broken NFT images → "No Image" placeholders

## 📝 Contributing

### Code Style
- TypeScript strict mode enabled
- ESLint + Prettier for code formatting
- Modular service architecture
- React functional components with hooks

### Adding New Features
1. **Intent Types**: Update `intent-parser.ts` and schema validation
2. **Data Sources**: Extend services in `services/wallet/`
3. **UI Components**: Add to appropriate component directories
4. **Message Parsing**: Update `message-utils.ts` for new data blocks

## 🚀 Deployment

SOLMate is built on Next.js and can be deployed on:
- **Vercel** (recommended)
- **Netlify**
- **AWS Amplify**
- **Self-hosted** with Node.js/Bun

Ensure all environment variables are configured in your deployment platform.
