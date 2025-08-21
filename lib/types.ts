// Common types for the SOL Mate application

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
    | "deposit"
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

// Simple transaction intent for the simplified version
export interface SimpleTransactionIntent {
  intentId: string;
  type: string;
  from: string;
  to: string;
  amount: number;
  token: string;
  description: string;
  createdAt: number;
  expiresAt: number;
}

export interface SwapIntent {
  type: "swap";
  inputToken: string;
  outputToken: string;
  amount: number;
}
