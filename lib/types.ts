// Common types for the SOL Sensei application

export interface ParsedIntent {
  type: "query" | "action";
  query?:
    | "portfolio"
    | "balances"
    | "nfts"
    | "txn_history"
    | "fees"
    | "positions"
    | null;
  filters?: {
    time_range?: { from?: string; to?: string };
    collection?: string;
    token_mint?: string;
    limit?: number;
  };
  action?:
    | "transfer"
    | "swap"
    | "stake"
    | "unstake"
    | "nft_transfer"
    | "nft_list"
    | null;
  params?: {
    amount?: string;
    token?: string;
    recipient?: string;
    slippage_bps?: number;
    market?: string;
    protocol?: string;
    deadline_sec?: number;
  };
}

export interface TokenData {
  symbol: string;
  name: string;
  balance: string;
  usdValue: number;
  percentage: number;
}

export interface WalletData {
  tokens: any[];
  nfts: any[];
  native_balance: {
    solana: string;
    usd_value: string;
  };
}

export interface WalletAnalytics {
  totalUsdValue: number;
  solBalance: number;
  solUsdValue: number;
  tokenCount: number;
  nftCount: number;
  topTokens: TokenData[];
  diversificationScore: "Low" | "Medium" | "High";
  concentrationRisk: "Low" | "Moderate" | "High";
}

export type DiversificationScore = "Low" | "Medium" | "High";
export type ConcentrationRisk = "Low" | "Moderate" | "High";
