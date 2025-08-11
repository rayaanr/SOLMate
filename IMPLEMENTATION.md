# SOLMate Implementation

## 🎯 Overview

SOLMate is a Solana Web3 assistant that converts natural language into structured JSON intents and provides live wallet analytics. This implementation focuses on **wallet balance queries** as the primary feature.

## 🏗️ Architecture

### Clean Service-Based Architecture

```
app/api/chat/route.ts     # Main API endpoint
├── lib/config.ts         # Environment configuration  
├── lib/debug.ts          # Debug logging utility
├── lib/types.ts          # TypeScript interfaces
├── lib/ai-service.ts     # AI intent parsing & responses
└── lib/wallet-service.ts # Moralis API & analytics
```

## 🔧 Core Features

### 1. **Intent Parsing System** 
- Converts natural language to structured JSON intents
- Based on the schema defined in `idea.md`
- Distinguishes between **queries** (read-only) and **actions** (write operations)

### 2. **Smart Routing**
- **Wallet Queries** → Moralis API + Live Analytics  
- **Action Intents** → Acknowledgment (execution coming soon)
- **General Questions** → Direct OpenAI response

### 3. **Comprehensive Debug Logging**
- All OpenAI requests/responses logged
- Wallet API calls and responses tracked  
- Intent parsing and routing decisions logged
- Error handling with full context

## 🧪 Testing Examples

Try these queries to test different flows:

### Wallet Balance Queries (Uses Moralis API)
```
"What's my wallet balance?"
"Show me my portfolio" 
"How much SOL do I have?"
"What tokens am I holding?"
```

### Action Intents (Acknowledged but not executed)
```
"Send 5 USDC to alice.sol"
"Swap 10 SOL for USDC"
"Stake 5 SOL"
```

### General Queries (Direct OpenAI)
```
"What is Solana?"
"How does DeFi work?"
"Explain NFTs"
```

## 🔍 Debug Console Output

When `DEBUG_ENABLED=true`, you'll see detailed logs:

```
🔍 [2025-08-09T12:00:00.000Z] CHAT_REQUEST
📝 Received chat request
📊 Data: {"prompt": "What's my wallet balance?"}

🚀 [2025-08-09T12:00:00.100Z] OPENAI_SEND  
📝 Content: User message: "What's my wallet balance?"
🔧 Metadata: {"model": "gpt-4o-mini", "system": "INTENT_PARSER_PROMPT"}

📥 [2025-08-09T12:00:00.500Z] OPENAI_RECEIVE
📝 Content: {"type": "query", "query": "balances", ...}

🔍 [2025-08-09T12:00:00.600Z] WALLET_FETCH
📝 Fetching wallet data from Moralis API
📊 Data: {"address": "kXB7...gVs", "url": "https://solana-gateway.moralis.io/..."}

🔍 [2025-08-09T12:00:01.200Z] WALLET_ANALYSIS  
📝 Wallet analysis completed
📊 Data: {"totalUsdValue": 1234.56, "tokenCount": 8, ...}

🚀 [2025-08-09T12:00:01.300Z] OPENAI_SEND
📝 Content: User asked: "What's my wallet balance?" ...
```

## 🚀 Quick Setup

1. **Copy environment variables:**
```bash
cp .env.example .env.local
```

2. **Add your OpenAI API key:**
```bash
# In .env.local
OPENAI_API_KEY=your_actual_openai_key
```

3. **Start development:**
```bash
bun dev
```

The Moralis API key and wallet address are pre-configured for testing.

## 📋 Environment Variables

Required:
- `OPENAI_API_KEY` - Your OpenAI API key
- `MORALIS_API_KEY` - Pre-configured for testing  
- `WALLET_ADDRESS` - Pre-configured test wallet
- `DEBUG_ENABLED` - Set to `true` for detailed logging

## 🎯 Current Status

✅ **Implemented:**
- Intent parsing with AI
- Wallet balance queries with live data
- Comprehensive analytics generation
- Debug logging system
- Clean service architecture

🔄 **Coming Soon:**
- On-chain action execution
- Multi-wallet support
- Advanced portfolio analytics
- Transaction history queries

## 🔧 Key Components

### Intent Schema
Following the exact schema from `idea.md`:
```typescript
{
  type: "query" | "action",
  query: "portfolio" | "balances" | "nfts" | ...,
  filters: { time_range, collection, token_mint, limit },
  action: "transfer" | "swap" | "stake" | ...,
  params: { amount, token, recipient, ... }
}
```

### Analytics Output
Rich portfolio analytics including:
- Total portfolio value in USD
- Native SOL balance and USD value  
- Token holdings breakdown with percentages
- Portfolio diversification analysis
- Risk assessment and recommendations
- NFT collection summary

The implementation is clean, well-structured, and ready for production use with comprehensive debugging capabilities.
