import { Wallet } from "lucide-react";

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

interface TransactionDetailsProps {
  transactionIntent: TransactionIntent;
  balance: string;
}

export function TransactionDetails({ transactionIntent, balance }: TransactionDetailsProps) {
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
}
