"use client";

import { useState, useEffect } from "react";
import {
  useSolanaWallet,
  useSignAndSendTransaction,
} from "@web3auth/modal/react/solana";
import {
  PublicKey,
  SystemProgram,
  LAMPORTS_PER_SOL,
  TransactionMessage,
  VersionedTransaction,
  TransactionInstruction,
  Connection,
} from "@solana/web3.js";
import {
  createTransferInstruction,
  getAssociatedTokenAddress,
  createAssociatedTokenAccountInstruction,
} from "@solana/spl-token";
import { Button } from "./ui/button";
import { Wallet, Loader2, AlertCircle, CheckCircle2 } from "lucide-react";
import Decimal from "decimal.js";

interface TokenConfig {
  mint: string;
  decimals: number;
  symbol: string;
}

interface TransactionIntent {
  type: "transfer";
  recipient: string;
  amount: number;
  token?: {
    mint: string;
    symbol: string;
    decimals: number;
  };
}

interface TransactionActionsProps {
  transactionIntent: TransactionIntent;
  onTransactionComplete?: (signature: string) => void;
}

const getTokenAmount = (accountData: any): number => {
  return accountData?.data?.parsed?.info?.tokenAmount?.uiAmount ?? 0;
};

const getTokenAmountString = (accountData: any): string => {
  return accountData?.data?.parsed?.info?.tokenAmount?.uiAmountString ?? "0";
};

// Helper to validate Solana public keys
function isValidPublicKey(key: string): boolean {
  try {
    if (!key || typeof key !== "string") return false;
    // Will throw if invalid
    new PublicKey(key);
    return true;
  } catch {
    return false;
  }
}

export function TransactionActions({
  transactionIntent,
  onTransactionComplete,
}: TransactionActionsProps) {
  const {
    data: hash,
    error,
    loading: isPending,
    signAndSendTransaction,
  } = useSignAndSendTransaction();
  const { accounts, connection } = useSolanaWallet();

  const [localError, setLocalError] = useState<string | null>(null);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [balance, setBalance] = useState<string>("0");

  const heliusConnection = new Connection(
    process.env.NEXT_PUBLIC_HELIUS_RPC_URL ??
      "https://api.mainnet-beta.solana.com",
    "confirmed"
  );

  const createSOLTransfer = (
    from: PublicKey,
    to: PublicKey,
    amount: string
  ): TransactionInstruction => {
    const lamports = Math.round(parseFloat(amount) * LAMPORTS_PER_SOL);
    return SystemProgram.transfer({ fromPubkey: from, toPubkey: to, lamports });
  };

  const createSPLTransfer = async (
    senderPubkey: PublicKey,
    recipientPubkey: PublicKey,
    mintPubkey: PublicKey,
    amount: string,
    decimals: number
  ): Promise<TransactionInstruction[]> => {
    const instructions: TransactionInstruction[] = [];

    const senderAta = await getAssociatedTokenAddress(mintPubkey, senderPubkey);
    const senderInfo = await heliusConnection.getParsedAccountInfo(senderAta);

    if (!senderInfo.value) {
      throw new Error("Token account not found");
    }

    const senderBalance = getTokenAmount(senderInfo.value);
    if (senderBalance < parseFloat(amount)) {
      throw new Error(`Insufficient balance. Available: ${senderBalance}`);
    }

    const recipientAta = await getAssociatedTokenAddress(
      mintPubkey,
      recipientPubkey
    );
    const recipientInfo = await heliusConnection.getParsedAccountInfo(
      recipientAta
    );

    if (!recipientInfo.value) {
      instructions.push(
        createAssociatedTokenAccountInstruction(
          senderPubkey,
          recipientAta,
          recipientPubkey,
          mintPubkey
        )
      );
    }

    const rawAmount = new Decimal(amount)
      .mul(Decimal.pow(10, decimals))
      .floor()
      .toNumber();
    instructions.push(
      createTransferInstruction(
        senderAta,
        recipientAta,
        senderPubkey,
        BigInt(rawAmount)
      )
    );

    return instructions;
  };

  const executeTransfer = async () => {
    setLocalError(null);
    setStatus("idle");

    try {
      if (
        !accounts?.[0] ||
        !transactionIntent.recipient ||
        !transactionIntent.amount
      ) {
        throw new Error("Missing required fields");
      }

      // Validate recipient address
      if (!isValidPublicKey(transactionIntent.recipient)) {
        setLocalError("Invalid recipient address.");
        setStatus("error");
        return;
      }

      const senderKey = new PublicKey(accounts[0]);
      const recipientKey = new PublicKey(transactionIntent.recipient);

      let instructions: TransactionInstruction[] = [];

      if (!transactionIntent.token) {
        // SOL transfer
        instructions = [
          createSOLTransfer(
            senderKey,
            recipientKey,
            transactionIntent.amount.toString()
          ),
        ];
      } else {
        // Validate token mint address
        if (!isValidPublicKey(transactionIntent.token.mint)) {
          setLocalError("Invalid token mint address.");
          setStatus("error");
          return;
        }
        const mintKey = new PublicKey(transactionIntent.token.mint);
        instructions = await createSPLTransfer(
          senderKey,
          recipientKey,
          mintKey,
          transactionIntent.amount.toString(),
          transactionIntent.token.decimals
        );
      }

      const connectionForTx = connection || heliusConnection;
      const block = await connectionForTx.getLatestBlockhash();
      const msg = new TransactionMessage({
        payerKey: senderKey,
        recentBlockhash: block.blockhash,
        instructions,
      });

      const tx = new VersionedTransaction(msg.compileToV0Message());
      const signature = await signAndSendTransaction(tx);

      setStatus("success");
      if (onTransactionComplete && signature) {
        onTransactionComplete(signature);
      }
    } catch (err: any) {
      setLocalError(err.message || "Transfer failed");
      setStatus("error");
    }
  };
  
  // Call onTransactionComplete when hash changes (for hook-driven updates)
  useEffect(() => {
    if (hash && onTransactionComplete) {
      onTransactionComplete(hash);
    }
  }, [hash, onTransactionComplete]);

  const refreshBalance = async () => {
    if (!accounts?.[0]) return;

    try {
      const senderPubkey = new PublicKey(accounts[0]);

      if (!transactionIntent.token) {
        // SOL balance
        const balance = await heliusConnection.getBalance(senderPubkey);
        setBalance((balance / LAMPORTS_PER_SOL).toString());
      } else {
        // Token balance
        const mintKey = new PublicKey(transactionIntent.token.mint);
        const ata = await getAssociatedTokenAddress(mintKey, senderPubkey);
        const info = await heliusConnection.getParsedAccountInfo(ata);
        setBalance(info.value ? getTokenAmountString(info.value) : "0");
      }
    } catch {
      setBalance("0");
    }
  };

  useEffect(() => {
    refreshBalance();
  }, [accounts, transactionIntent]);

  const renderTransactionDetails = () => {
    const tokenSymbol = transactionIntent.token?.symbol || "SOL";

    return (
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-700 rounded-xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <Wallet className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            Transaction Details
          </h3>
          <div className="text-right">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Available Balance
            </p>
            <p className="font-semibold text-gray-900 dark:text-white">
              {balance} {tokenSymbol}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-gray-600 dark:text-gray-400 mb-1">Amount</p>
            <p className="font-semibold text-gray-900 dark:text-white">
              {transactionIntent.amount} {tokenSymbol}
            </p>
          </div>

          <div>
            <p className="text-gray-600 dark:text-gray-400 mb-1">Recipient</p>
            <p className="font-mono text-xs text-gray-900 dark:text-white break-all">
              {transactionIntent.recipient}
            </p>
          </div>
        </div>

        {transactionIntent.token && (
          <div className="text-sm">
            <p className="text-gray-600 dark:text-gray-400 mb-1">
              Token Details
            </p>
            <div className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-600">
              <p className="font-semibold text-gray-900 dark:text-white">
                {transactionIntent.token.symbol}
              </p>
              <p className="text-xs text-gray-600 dark:text-gray-400 font-mono break-all">
                {transactionIntent.token.mint}
              </p>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderStatusMessage = () => {
    if (localError || error) {
      return (
        <div className="flex items-center space-x-2 text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 p-3 rounded-lg border border-red-200 dark:border-red-800">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span className="text-sm">{localError || error?.message}</span>
        </div>
      );
    }

    if (status === "success" || hash) {
      return (
        <div className="flex items-center space-x-2 text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 p-3 rounded-lg border border-green-200 dark:border-green-800">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          <div className="text-sm">
            <p>Transaction successful!</p>
            {hash && (
              <p className="font-mono text-xs opacity-75 mt-1">
                Signature: {hash.slice(0, 8)}...{hash.slice(-8)}
              </p>
            )}
          </div>
        </div>
      );
    }

    return null;
  };

  if (!accounts?.[0]) {
    return (
      <div className="text-center p-6">
        <Wallet className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          Wallet Not Connected
        </h3>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          Please connect your wallet to execute transactions
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {renderTransactionDetails()}

      {renderStatusMessage()}

      <div className="flex gap-3 pt-2">
        <Button
          onClick={executeTransfer}
          disabled={isPending || status === "success"}
          className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold py-2 px-4 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isPending ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Executing...
            </>
          ) : status === "success" ? (
            "Transaction Completed"
          ) : (
            `Send ${transactionIntent.amount} ${
              transactionIntent.token?.symbol || "SOL"
            }`
          )}
        </Button>

        <Button
          onClick={refreshBalance}
          variant="outline"
          className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
        >
          Refresh
        </Button>
      </div>
    </div>
  );
}
