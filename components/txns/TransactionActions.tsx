"use client";

import { useSolanaWallet, useSignAndSendTransaction } from "@web3auth/modal/react/solana";
import { Button } from "../generic/button";
import { TransactionDetails } from "./TransactionDetails";
import { StatusMessage } from "./StatusMessage";
import { useTransaction } from "../../hooks/useTransaction";
import { useBalance } from "../../hooks/useBalance";
import { Wallet, Loader2 } from "lucide-react";

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

export function TransactionActions({
  transactionIntent,
  onTransactionComplete,
}: TransactionActionsProps) {
  const { accounts } = useSolanaWallet();
  const { loading: isPending } = useSignAndSendTransaction();

  // Use custom hooks
  const { localError, status, executeTransfer } = useTransaction({
    transactionIntent,
    onTransactionComplete,
  });

  const { balance, refreshBalance } = useBalance({
    userAddress: accounts?.[0],
    tokenMint: transactionIntent.token?.mint,
    tokenDecimals: transactionIntent.token?.decimals,
  });


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
      <TransactionDetails 
        transactionIntent={transactionIntent} 
        balance={balance} 
      />

      <StatusMessage 
        localError={localError}
        error={null}
        status={status}
        hash={null}
      />

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
