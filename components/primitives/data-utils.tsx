/**
 * Strip data reference tags from text for clean markdown rendering
 */
export function stripDataTags(text: string): string {
  return text
 export function stripDataTags(text: string): string {
   return text
-    .replace(/\[PORTFOLIO_DATA_ID\][^\[]+\[\/PORTFOLIO_DATA_ID\]/g, '')
-    .replace(/\[TRANSACTION_DATA_ID\][^\[]+\[\/TRANSACTION_DATA_ID\]/g, '')
-    .replace(/\[NFT_DATA_ID\][^\[]+\[\/NFT_DATA_ID\]/g, '')
-    .replace(/\[MARKET_DATA_ID\][^\[]+\[\/MARKET_DATA_ID\]/g, '')
    .replace(/\[PORTFOLIO_DATA_ID\][\s\S]*?\[\/PORTFOLIO_DATA_ID\]/g, '')
    .replace(/\[TRANSACTION_DATA_ID\][\s\S]*?\[\/TRANSACTION_DATA_ID\]/g, '')
    .replace(/\[NFT_DATA_ID\][\s\S]*?\[\/NFT_DATA_ID\]/g, '')
    .replace(/\[MARKET_DATA_ID\][\s\S]*?\[\/MARKET_DATA_ID\]/g, '')
    .replace(/\[SWAP_DATA_ID\][\s\S]*?\[\/SWAP_DATA_ID\]/g, '')
     // Handle inline data tags
     .replace(/\[TRANSACTION_DATA\][\s\S]*?\[\/TRANSACTION_DATA\]/g, '')
     .replace(/\[PORTFOLIO_DATA\][\s\S]*?\[\/PORTFOLIO_DATA\]/g, '')
    // Handle inline data tags
    .replace(/\[TRANSACTION_DATA\][\s\S]*?\[\/TRANSACTION_DATA\]/g, '')
    .replace(/\[PORTFOLIO_DATA\][\s\S]*?\[\/PORTFOLIO_DATA\]/g, '')
    .replace(/\[NFT_DATA\][\s\S]*?\[\/NFT_DATA\]/g, '')
    .replace(/\[MARKET_DATA\][\s\S]*?\[\/MARKET_DATA\]/g, '')
    .replace(/\[SWAP_DATA\][\s\S]*?\[\/SWAP_DATA\]/g, '')
    .replace(/\[TRANSACTION_HISTORY_DATA\][\s\S]*?\[\/TRANSACTION_HISTORY_DATA\]/g, '')
    .replace(/\[SWAP_DATA\][\s\S]*?\[\/SWAP_DATA\]/g, '')
    .trim();
}
   .trim();
 }
