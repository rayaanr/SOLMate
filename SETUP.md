# SOL Mate - AI Chat Interface Setup

## OpenAI API Key Setup

To use the AI chat interface, you need to set up your OpenAI API key:

1. Get your API key from [OpenAI Platform](https://platform.openai.com/api-keys)
2. Copy your API key
3. Open `.env.local` file in the project root
4. Replace `your_openai_api_key_here` with your actual API key:

```
OPENAI_API_KEY=sk-proj-your-actual-api-key-here
```

5. Save the file and restart your development server

## Features

- ✅ Clean AI chat interface similar to modern AI assistants
- ✅ Streaming responses for real-time conversation
- ✅ SOLMate persona specialized in Solana development
- ✅ Dark mode support
- ✅ Responsive design
- ✅ Web3Auth wallet integration in navbar
- ✅ Mode selection buttons (Summary, Code, Design, Research, Get Inspired)
- ✅ Thinking modes (Think Deeply, Learn Gently)

## How to Use

1. Start the development server: `bun run dev`
2. Open http://localhost:3001
3. Connect your wallet using the navbar (optional)
4. Ask SOLMate questions about Solana development
5. Get expert guidance on DeFi, smart contracts, and Web3 development

The interface will guide you through Solana ecosystem development with specialized knowledge and code examples.
