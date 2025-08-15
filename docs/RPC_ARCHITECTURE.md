# RPC Connection Architecture

## Overview

This document outlines SOLMate's centralized RPC connection architecture, which eliminates the need to create multiple RPC connections throughout the application and provides a consistent interface for interacting with the Solana blockchain.

## Architecture Components

### 1. SolanaRPCProvider (Client-Side)

**File**: `providers/SolanaRPCProvider.tsx`

A React Context Provider that creates and manages a single RPC connection for the entire client-side application.

```typescript
import { useSolanaConnection } from '@/providers/SolanaRPCProvider';

function MyComponent() {
  const connection = useSolanaConnection();
  // Use connection...
}
```

**Features:**
- ✅ Single connection instance per app
- ✅ Memoized connection to prevent recreation
- ✅ Configurable RPC URL and commitment levels
- ✅ Type-safe context with error handling
- ✅ Automatic fallback to default RPC if env var not set

### 2. RPCService (Server-Side & Services)

**File**: `services/utils/rpc-service.ts`

A singleton service class that provides RPC connections for server-side code and services where React hooks are not available.

```typescript
import { getSolanaConnection } from '@/services/utils/rpc-service';

// In services or server-side code
const connection = getSolanaConnection();
```

**Features:**
- ✅ Singleton pattern ensures single instance
- ✅ Works in server-side and service contexts
- ✅ Supports both public and private env vars
- ✅ Configurable commitment levels

## RPC URL Priority

The system uses the following priority order for RPC URLs:

1. **Custom URL** (if provided to SolanaRPCProvider)
2. **NEXT_PUBLIC_HELIUS_RPC_URL** (client-side)
3. **HELIUS_RPC_URL** (server-side only)
4. **Default Mainnet** (`https://api.mainnet-beta.solana.com`)

## Provider Hierarchy

The providers are structured in this hierarchy for optimal functionality:

```typescript
<Web3AuthProvider>
  <SolanaRPCProvider>        // ← Centralized RPC connections
    <JupiterProvider>        // ← Uses centralized RPC
      <App />
    </JupiterProvider>
  </SolanaRPCProvider>
</Web3AuthProvider>
```

## Usage Examples

### Client-Side Components & Hooks

```typescript
// In React components or hooks
import { useSolanaConnection } from '@/providers/SolanaRPCProvider';

export function MyComponent() {
  const connection = useSolanaConnection();
  
  // Use connection for balance queries, account info, etc.
  const balance = await connection.getBalance(publicKey);
}
```

### Service Layer & Server-Side

```typescript
// In services or API routes
import { getSolanaConnection } from '@/services/utils/rpc-service';

export async function fetchAccountData(address: string) {
  const connection = getSolanaConnection();
  return await connection.getAccountInfo(new PublicKey(address));
}
```

### Jupiter Provider Integration

The Jupiter provider automatically uses the centralized connection:

```typescript
const { connection } = useJupiter(); // Already uses centralized RPC
```

## Migration Guide

### Before (Problematic Pattern)
```typescript
// ❌ Multiple connections created everywhere
const connection1 = new Connection(process.env.NEXT_PUBLIC_HELIUS_RPC_URL!);
const connection2 = new Connection("https://api.mainnet-beta.solana.com");
const connection3 = useMemo(() => new Connection(rpcUrl), [rpcUrl]);
```

### After (Centralized Pattern)
```typescript
// ✅ Single source of truth
const connection = useSolanaConnection(); // In components
const connection = getSolanaConnection(); // In services
```

## Files Updated

### Core Infrastructure
- `providers/SolanaRPCProvider.tsx` - New centralized provider
- `services/utils/rpc-service.ts` - New singleton service
- `app/provider.tsx` - Added SolanaRPCProvider to hierarchy

### Updated to Use Centralized Connections
- `providers/JupProvider.tsx` - Uses centralized connection
- `hooks/useBalance.ts` - Simplified to use centralized connection
- `hooks/useTransaction.ts` - Uses centralized connection
- `hooks/useSwap.ts` - Already uses Jupiter (which now uses centralized)

## Benefits

### 🚀 Performance
- **Single Connection**: No duplicate connections consuming resources
- **Memoization**: Connections are cached and reused
- **Reduced Memory**: Lower memory footprint

### 🔧 Maintainability  
- **DRY Principle**: RPC configuration in one place
- **Easy Updates**: Change RPC URL once, affects entire app
- **Type Safety**: Centralized error handling

### 🏗️ Architecture
- **Separation of Concerns**: Clear distinction between client/server RPC usage
- **Provider Pattern**: Follows React best practices
- **Service Layer**: Clean abstraction for non-React code

### 🐛 Reliability
- **Consistent Configuration**: No mismatched RPC URLs across components
- **Error Handling**: Centralized connection error management
- **Fallback Support**: Automatic fallback to default RPC

## Environment Variables

```bash
# Client-side (exposed to browser)
NEXT_PUBLIC_HELIUS_RPC_URL=https://your-helius-endpoint

# Server-side only (secure)
HELIUS_RPC_URL=https://your-helius-endpoint
```

## Best Practices

1. **Use `useSolanaConnection()`** in React components and hooks
2. **Use `getSolanaConnection()`** in services and server-side code  
3. **Don't create new Connection instances** unless absolutely necessary
4. **Prefer centralized connections** over direct Connection creation
5. **Use appropriate commitment levels** based on use case

This architecture provides a solid foundation for scalable Solana application development while maintaining performance and reliability.
