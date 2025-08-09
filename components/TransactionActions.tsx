import React, { useState } from "react";
import { Button } from "./ui/button";
import { Wallet, Loader2 } from "lucide-react";
import { useSolanaWallet } from "@web3auth/modal/react/solana";
import { useWeb3AuthConnect, useWeb3Auth } from "@web3auth/modal/react";
import { 
  Connection, 
  clusterApiUrl, 
  PublicKey, 
  SystemProgram, 
  Transaction,
  LAMPORTS_PER_SOL 
} from "@solana/web3.js";
import { 
  getAssociatedTokenAddress, 
  createAssociatedTokenAccountInstruction, 
  createTransferInstruction, 
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID 
} from "@solana/spl-token";
import { SolanaWallet } from "@web3auth/solana-provider";

interface TransactionIntent {
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

interface TransactionActionsProps {
  intent: TransactionIntent;
  onTransactionComplete?: (signature: string) => void;
}

export function TransactionActions({
  intent,
  onTransactionComplete,
}: TransactionActionsProps) {
  const [isExecuting, setIsExecuting] = useState(false);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [message, setMessage] = useState("");
  
  // Web3Auth hooks
  const { accounts } = useSolanaWallet();
  const { isConnected, connect } = useWeb3AuthConnect();
  const { provider } = useWeb3Auth();
  
  // Create connection with fallback RPC endpoints (using your Helius RPC as primary)
  const getRPCConnection = () => {
    // Your Helius RPC as primary, with public fallbacks
    const endpoints = [
      'https://mainnet.helius-rpc.com/?api-key=45e4ac71-068f-4b07-bc40-2c4222bca672',
      'https://api.mainnet-beta.solana.com',
      'https://solana-api.projectserum.com',
      'https://rpc.ankr.com/solana',
      'https://solana.public-rpc.com'
    ];
    
    // Use your Helius RPC by default for better performance
    return new Connection(endpoints[0], 'confirmed');
  };
  
  // Try to get latest blockhash with fallback RPC endpoints
  const getLatestBlockhashWithFallback = async (): Promise<{ blockhash: string }> => {
    const endpoints = [
      'https://mainnet.helius-rpc.com/?api-key=45e4ac71-068f-4b07-bc40-2c4222bca672',
      'https://api.mainnet-beta.solana.com',
      'https://solana-api.projectserum.com', 
      'https://rpc.ankr.com/solana',
      'https://solana.public-rpc.com'
    ];
    
    let lastError: Error | null = null;
    
    for (const endpoint of endpoints) {
      try {
        const connection = new Connection(endpoint, 'confirmed');
        const result = await connection.getLatestBlockhash();
        console.log(`Successfully connected to RPC: ${endpoint}`);
        return result;
      } catch (error) {
        console.warn(`RPC ${endpoint} failed:`, error);
        lastError = error as Error;
        continue;
      }
    }
    
    throw new Error(`All RPC endpoints failed. Last error: ${lastError?.message}`);
  };
  
  const connection = getRPCConnection();



  // Execute transaction with Web3Auth wallet
  const executeWithConnectedWallet = async () => {
    if (!isConnected || !accounts || accounts.length === 0) {
      setMessage("Please connect your wallet first");
      connect();
      return;
    }

    if (!provider) {
      setMessage("Web3Auth provider not available");
      setStatus("error");
      return;
    }

    setIsExecuting(true);
    setStatus("idle");
    setMessage("Building transaction...");

    try {
      // Create Solana wallet instance from Web3Auth provider
      const solanaWallet = new SolanaWallet(provider);
      
      console.log("Transaction parameters:", intent);
      console.log("User account:", accounts[0]);
      
      // Get the latest blockhash with fallback
      const { blockhash } = await getLatestBlockhashWithFallback();
      
      // Create transaction
      const transaction = new Transaction();
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = new PublicKey(accounts[0]);
      
      if (intent.type === 'SOL_TRANSFER') {
        // SOL transfer
        const lamports = Math.round(intent.amount * LAMPORTS_PER_SOL);
        
        transaction.add(
          SystemProgram.transfer({
            fromPubkey: new PublicKey(intent.from),
            toPubkey: new PublicKey(intent.to),
            lamports,
          })
        );
        
        console.log(`Building SOL transfer: ${intent.amount} SOL to ${intent.to}`);
      } else {
        // SPL Token transfer
        const mintAddress = getTokenMintAddress(intent.token);
        if (!mintAddress) {
          throw new Error(`Unsupported token: ${intent.token}`);
        }
        
        const mint = new PublicKey(mintAddress);
        const fromTokenAccount = await getAssociatedTokenAddress(mint, new PublicKey(intent.from));
        const toTokenAccount = await getAssociatedTokenAddress(mint, new PublicKey(intent.to));
        
        // Check if recipient token account exists
        const toTokenAccountInfo = await connection.getAccountInfo(toTokenAccount);
        if (!toTokenAccountInfo) {
          // Create associated token account for recipient
          transaction.add(
            createAssociatedTokenAccountInstruction(
              new PublicKey(intent.from), // payer
              toTokenAccount, // associatedToken
              new PublicKey(intent.to), // owner
              mint, // mint
              TOKEN_PROGRAM_ID,
              ASSOCIATED_TOKEN_PROGRAM_ID
            )
          );
        }
        
        // Add transfer instruction
        const decimals = getTokenDecimals(intent.token);
        const amount = Math.round(intent.amount * Math.pow(10, decimals));
        
        transaction.add(
          createTransferInstruction(
            fromTokenAccount,
            toTokenAccount,
            new PublicKey(intent.from),
            amount,
            [],
            TOKEN_PROGRAM_ID
          )
        );
        
        console.log(`Building ${intent.token} transfer: ${intent.amount} ${intent.token} to ${intent.to}`);
      }

      setMessage("Please approve the transaction in your wallet...");
      
      console.log("Transaction ready:", {
        instructions: transaction.instructions.length,
        feePayer: transaction.feePayer?.toString(),
        recentBlockhash: transaction.recentBlockhash,
        signatures: transaction.signatures.length
      });
      
      // Sign and send transaction using Web3Auth
      let signature: string;
      try {
        const result = await solanaWallet.signAndSendTransaction(transaction);
        signature = typeof result === 'string' ? result : result.signature;
        console.log("Transaction sent with signature:", signature);
      } catch (signError) {
        console.error("Transaction signing/sending failed:", signError);
        
        // Try alternative method: sign first, then send
        if (signError instanceof Error && signError.message.includes("Response has no error or result")) {
          setMessage("Retrying with alternative signing method...");
          
          try {
            // Sign the transaction first
            const signedTx = await solanaWallet.signTransaction(transaction);
            console.log("Transaction signed, now sending...");
            
            // Send the signed transaction using connection
            const rawTransaction = signedTx.serialize();
            signature = await connection.sendRawTransaction(rawTransaction, {
              skipPreflight: false,
              preflightCommitment: 'confirmed'
            });
            console.log("Transaction sent via connection:", signature);
          } catch (altError) {
            console.error("Alternative signing method failed:", altError);
            
            // Final fallback: Try native browser wallet if available
            if ((window as any).solana && (window as any).solana.isPhantom) {
              setMessage("Trying native Phantom wallet...");
              try {
                const phantomWallet = (window as any).solana;
                await phantomWallet.connect();
                
                // Set the fee payer to the phantom wallet's public key
                transaction.feePayer = phantomWallet.publicKey;
                
                const signedTransaction = await phantomWallet.signTransaction(transaction);
                const rawTx = signedTransaction.serialize();
                
                signature = await connection.sendRawTransaction(rawTx, {
                  skipPreflight: false,
                  preflightCommitment: 'confirmed'
                });
                console.log("Transaction sent via Phantom:", signature);
              } catch (phantomError) {
                console.error("Phantom fallback failed:", phantomError);
                throw signError; // Throw original Web3Auth error
              }
            } else if ((window as any).solflare) {
              setMessage("Trying native Solflare wallet...");
              try {
                const solflareWallet = (window as any).solflare;
                await solflareWallet.connect();
                
                transaction.feePayer = new PublicKey(solflareWallet.publicKey.toString());
                
                const signedTransaction = await solflareWallet.signTransaction(transaction);
                const rawTx = signedTransaction.serialize();
                
                signature = await connection.sendRawTransaction(rawTx, {
                  skipPreflight: false,
                  preflightCommitment: 'confirmed'
                });
                console.log("Transaction sent via Solflare:", signature);
              } catch (solflareError) {
                console.error("Solflare fallback failed:", solflareError);
                throw signError; // Throw original Web3Auth error
              }
            } else {
              throw signError; // No fallback available
            }
          }
        } else {
          throw signError;
        }
      }
      
      setMessage("Transaction sent! Confirming...");

      // Wait for confirmation using getSignatureStatus (more reliable)
      let confirmed = false;
      let retries = 0;
      const maxRetries = 30;
      
      while (!confirmed && retries < maxRetries) {
        const status = await connection.getSignatureStatus(signature);
        if (status.value?.confirmationStatus === 'confirmed' || status.value?.confirmationStatus === 'finalized') {
          confirmed = true;
          if (status.value.err) {
            throw new Error(`Transaction failed: ${JSON.stringify(status.value.err)}`);
          }
        } else {
          retries++;
          await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
        }
      }
      
      if (!confirmed) {
        throw new Error('Transaction confirmation timeout');
      }

      setStatus("success");
      setMessage(`Transaction confirmed! Signature: ${signature.slice(0, 8)}...${signature.slice(-8)}`);
      onTransactionComplete?.(signature);
      
      // Show Solana Explorer link
      console.log(`View transaction: https://explorer.solana.com/tx/${signature}`);
      
    } catch (error) {
      console.error("Transaction execution failed:", error);
      setStatus("error");
      
      if (error instanceof Error) {
        if (error.message.includes("User rejected") || 
            error.message.includes("rejected") || 
            error.message.includes("cancelled") ||
            error.message.includes("denied")) {
          setMessage("Transaction was cancelled by user");
        } else if (error.message.includes("insufficient funds") ||
                   error.message.includes("Insufficient")) {
          setMessage("Insufficient funds for this transaction");
        } else if (error.message.includes("blockhash not found")) {
          setMessage("Transaction expired. Please try again.");
        } else {
          setMessage(`Transaction failed: ${error.message}`);
        }
      } else {
        setMessage("Transaction failed. Please try again.");
      }
    } finally {
      setIsExecuting(false);
      setTimeout(() => {
        if (status !== "success") {
          setStatus("idle");
          setMessage("");
        }
      }, 8000);
    }
  };
  
  // Helper function to get token mint address
  const getTokenMintAddress = (token: string): string | null => {
    const tokenMints: Record<string, string> = {
      'USDC': 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
      'USDT': 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB',
      'SOL': 'So11111111111111111111111111111111111111112', // Wrapped SOL
    };
    return tokenMints[token.toUpperCase()] || null;
  };
  
  // Helper function to get token decimals
  const getTokenDecimals = (token: string): number => {
    const tokenDecimals: Record<string, number> = {
      'USDC': 6,
      'USDT': 6,
      'SOL': 9,
    };
    return tokenDecimals[token.toUpperCase()] || 9;
  };

  // Check if intent has expired
  const isExpired = Date.now() > intent.expiresAt;

  if (isExpired) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mt-4">
        <p className="text-yellow-800 text-sm">
          ⚠️ This transaction has expired. Please generate a new one.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mt-4 space-y-4">
      {/* Transaction Preview */}
      <div className="space-y-2">
        <h4 className="font-semibold text-sm text-gray-700">
          Transaction Preview
        </h4>
        <div className="text-sm text-gray-600 space-y-1">
          <p>
            <span className="font-medium">Type:</span>{" "}
            {intent.description}
          </p>
          <p>
            <span className="font-medium">Amount:</span> {intent.amount}{" "}
            {intent.token}
          </p>
          <p>
            <span className="font-medium">To:</span>{" "}
            {intent.to.slice(0, 8)}...{intent.to.slice(-8)}
          </p>
          <p>
            <span className="font-medium">Est. Fee:</span>{" "}
            ~0.000005 SOL
          </p>
          <p>
            <span className="font-medium">Expires:</span>{" "}
            {new Date(intent.expiresAt).toLocaleTimeString()}
          </p>
        </div>
      </div>

      {/* Action Button */}
      <div className="space-y-2">
        <Button
          onClick={executeWithConnectedWallet}
          variant="default"
          className="w-full"
          disabled={isExecuting || !isConnected}
        >
          {isExecuting ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Executing...
            </>
          ) : (
            <>
              <Wallet className="w-4 h-4 mr-2" />
              {isConnected ? "Sign & Send Transaction" : "Connect Wallet First"}
            </>
          )}
        </Button>
      </div>

      {/* Status Messages */}
      {message && (
        <div
          className={`p-3 rounded-lg text-sm ${
            status === "success"
              ? "bg-green-50 text-green-800 border border-green-200"
              : status === "error"
              ? "bg-red-50 text-red-800 border border-red-200"
              : "bg-blue-50 text-blue-800 border border-blue-200"
          }`}
        >
          {message}
        </div>
      )}

      {/* Help Text */}
      <div className="text-xs text-gray-500 mt-2">
        <p>
          🔐 <strong>Web3Auth Integration</strong> - Secure wallet connection and transaction signing
        </p>
        <p>
          ⚡ <strong>One-Click Execution</strong> - Direct transaction signing and broadcasting to Solana mainnet
        </p>
      </div>
    </div>
  );
}
