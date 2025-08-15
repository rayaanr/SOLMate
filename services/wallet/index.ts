export { WalletService } from "./wallet-service";
export { 
  fetchWalletData, 
  isValidWalletAddress, 
  sanitizeAddress 
} from "./wallet-data";
export { 
  analyzeWalletData, 
  generateAnalyticsString 
} from "./wallet-analytics";
export type { WalletData, WalletAnalytics, TokenData } from "./wallet-service";
