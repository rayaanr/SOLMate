import { Connection } from "@solana/web3.js";

/**
 * Centralized RPC service for server-side and service usage
 * 
 * This provides a singleton Connection instance that can be used
 * in services and server-side code where React hooks are not available.
 */
class RPCService {
  private static instance: RPCService;
  private connection: Connection;
  private rpcUrl: string;

  private constructor() {
    this.rpcUrl = 
      process.env.NEXT_PUBLIC_HELIUS_RPC_URL ||
      process.env.HELIUS_RPC_URL ||
      "https://api.mainnet-beta.solana.com";
      
    this.connection = new Connection(this.rpcUrl, "confirmed");
  }

  public static getInstance(): RPCService {
    if (!RPCService.instance) {
      RPCService.instance = new RPCService();
    }
    return RPCService.instance;
  }

  public getConnection(): Connection {
    return this.connection;
  }

  public getRpcUrl(): string {
    return this.rpcUrl;
  }

  /**
   * Create a new connection with specific commitment level
   */
  public createConnection(commitment: "processed" | "confirmed" | "finalized" = "confirmed"): Connection {
    return new Connection(this.rpcUrl, commitment);
  }
}

// Export singleton instance
export const rpcService = RPCService.getInstance();

// Export convenience functions
export const getSolanaConnection = () => rpcService.getConnection();
export const getSolanaRpcUrl = () => rpcService.getRpcUrl();
