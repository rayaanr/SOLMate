# SOLMate - The AI That Speaks Your Wallet's Language

**A revolutionary AI-powered assistant for seamless Solana blockchain interactions**

[![Demo](https://img.shields.io/badge/🚀-Live%20Demo-blue)](https://youtu.be/NVaiMfdAwK0)

SOLMate is an AI chat tool that makes using the Solana blockchain as easy as talking. Instead of dealing with complicated dApps or dashboards, users can just type what they want to do in simple language. By using **MetaMask Embedded Wallet SDKs (Web3Auth Plug and Play)**, SOLMate lets people create a wallet instantly with just their social or email login. Everyday tasks like checking balances, swapping tokens, or sending payments become quick, easy conversations — perfect for beginners.  

---

## ❌ Problem  
Web3 is still too complicated for most people. To check a balance, swap tokens, or transfer tokens, users have to move between different apps and dashboards, copy long wallet addresses, and worry about fees and technical terms. This confuses new users and makes even simple tasks feel like a chore.  

---

## 💡 Solution  
SOLMate is a chat-based assistant that makes all of this simple. Users can just type what they want, like:  

- “What’s my SOL balance?”  
- “Swap 10 USDC to SOL”  

SOLMate will guide them through the process. It explains each step in plain English so users feel confident, while the final action is always confirmed by the user in their wallet.  

---

## 🌍 Impact  
With SOLMate, anyone can use Solana without needing to be an expert. This lowers the barrier for beginners, improves the experience for regular users, and helps grow adoption and activity across the Solana ecosystem.  

---

## 🔒 Note on Security & Control  
SOLMate does not take over user funds or execute transactions on its own. The AI provides a simple chat interface that prepares and explains actions like swaps or transfers in plain English. **The final step is always verified and confirmed by the user in their wallet.** This ensures that the experience stays easy while the user remains fully in control of their assets.  

---

## ✨ Core Features  

### 🧠 AI-Powered Conversational Interface  
- **Natural Language Processing**: Understands wallet queries and commands  
- **Intent Recognition**: Distinguishes between queries and actions  
- **Context Awareness**: Maintains conversation flow across multiple steps  
- **Clarification Support**: Users can ask *“why”* or *“how”* to better understand transactions  
- **Smart Error Handling**: Provides clear guidance when input is unclear  

### 💼 Comprehensive Wallet Analytics  
- **Real-time Portfolio Tracking**: Live balances for SOL and 50+ SPL tokens  
- **Transaction History Analysis**: Categorized, with smart filtering  
- **NFT Collection Management**: View and track your NFT portfolio  

### 💰 Advanced Market Intelligence  
- **Live Price Data**: Real-time pricing via Moralis API  
- **Market Trends**: Gainers, losers, and emerging tokens  

### ⚡ Seamless Transaction Execution  
- **Jupiter Integration**: Best-in-class DEX aggregation for optimal rates  
- **Natural Language Swaps**: e.g., “Swap 5 SOL to USDC”  
- **Domain Resolution**: Support for .sol domains (e.g., `alice.sol`)  
- **Smart Gas Management**: Optimized fees and prioritization  
- **Transaction Simulation**: Preview before execution  

### 💸 Solana Pay Integration  
- **QR Code Generation**: Payment requests via QR  
- **Deep Wallet Links**: Phantom, Solflare, and others  
- **Payment Tracking**: Real-time monitoring  
- **Multi-Token Payments**: Accept SOL or any SPL token  

### 🔐 Enterprise-Grade Authentication  
- **Web3Auth Embedded Wallet**: Integrated using the MetaMask Embedded Wallet SDK (Web3Auth Plug and Play)  
- **Simple UI for Connection**: When a user starts an action (like checking balance, swap, or transfer), the system prompts them to connect their wallet through a Web3Auth-powered modal. 
- **Social & Email Login**: Sign in with Google, Twitter, GitHub, or email — no seed phrase needed.  
- **Transaction Flow**:  
  1. User gives a command (e.g., "Swap 10 USDC to SOL").  
  2. SOLMate prepares the transaction and shows details in plain English.  
  3. Web3Auth wallet pops up for confirmation.  
  4. The user reviews and approves.  
- **Cross-Device Sync**: Wallet access continues across devices using the same social/email login.  


---

## 🛠️ Technology Stack  

- **Front-End**: Next.js, React 19, Tailwind CSS, Motion  
- **AI & Data Processing**: OpenAI API, Vercel AI SDK  
- **Blockchain & Web3**: Solana Web3.js, Jupiter API, Bonfida Name Service, Solana Pay  
- **Authentication**: Web3Auth  

---

## 🎯 Example Commands & Use Cases  

### 📂 Wallet Management  
- “What’s my SOL balance?”  
- “Show me all my token balances”  
- “What’s my portfolio worth in USD?”  
- “Display my recent transactions”  
- “Show me my NFT collection”  

### 💱 Token Swaps  
- “Swap 5 SOL to USDC”  
- “Convert 100 USDT to JUP”  
- “Exchange 1000 BONK for RAY”  
- “Swap half my SOL for USDC”  

### 💸 Payments & Transfers  
- “Send 0.5 SOL to alice.sol”  
- “Transfer 100 USDC to [wallet address]”  
- “Create a payment request for 2 SOL”  
- “Generate QR code for 50 USDC payment”  

### 📊 Market Analysis  
- “What’s the current SOL price?”  
- “Which tokens are trending down?”  
- “What’s the market cap of JUP?”  
- “Give me a market overview”  

---

## 🛠️ Getting Started  

**Prerequisites:** Node.js 18+, Git  

### Quick Setup  

```bash
# Clone the Repository
git clone https://github.com/rayaanr/SOLMate.git
cd SOLMate

# Install Dependencies
npm install

# Configure Environment
cp .env.example .env.local
# Replace ENV variables with actual keys

# Start Development Server
npm run dev
```

**Built with ❤️ for the Solana ecosystem**

*SOLMate is more than a wallet interface — it's the bridge that brings Web3 to everyone.*
