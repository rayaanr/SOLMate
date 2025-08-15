import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  useSolanaWallet,
  useSignAndSendTransaction,
} from '@web3auth/modal/react/solana';
import {
  PublicKey,
  SystemProgram,
  LAMPORTS_PER_SOL,
  TransactionMessage,
  VersionedTransaction,
  TransactionInstruction,
  Connection,
} from '@solana/web3.js';
import {
  createTransferInstruction,
  getAssociatedTokenAddress,
  createAssociatedTokenAccountInstruction,
} from '@solana/spl-token';
import Decimal from 'decimal.js';

interface TransactionIntent {
  type: 'transfer';
  recipient: string;
  amount: number;
  token?: {
    mint: string;
    symbol: string;
    decimals: number;
  };
}

interface UseTransactionParams {
  transactionIntent: TransactionIntent;
  onTransactionComplete?: (signature: string) => void;
}

interface UseTransactionReturn {
  localError: string | null;
  status: 'idle' | 'success' | 'error';
  executeTransfer: () => Promise<void>;
  isValidTransaction: boolean;
}

const getTokenAmount = (accountData: any): number => {
  return accountData?.data?.parsed?.info?.tokenAmount?.uiAmount ?? 0;
};

// Helper to validate Solana public keys
const isValidPublicKey = (key: string): boolean => {
  try {
    if (!key || typeof key !== 'string') return false;
    new PublicKey(key);
    return true;
  } catch {
    return false;
  }
};

export function useTransaction({
  transactionIntent,
  onTransactionComplete,
}: UseTransactionParams): UseTransactionReturn {
  const [localError, setLocalError] = useState<string | null>(null);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const {
    data: hash,
    error,
    loading: isPending,
    signAndSendTransaction,
  } = useSignAndSendTransaction();
  
  const { accounts, connection } = useSolanaWallet();

  // Memoize the connection to avoid recreating
  const heliusConnection = useMemo(
    () => new Connection(
      process.env.NEXT_PUBLIC_HELIUS_RPC_URL ?? 'https://api.mainnet-beta.solana.com',
      'confirmed'
    ),
    []
  );

  // Memoize validation result
  const isValidTransaction = useMemo(() => {
    return (
      !!accounts?.[0] &&
      !!transactionIntent.recipient &&
      !!transactionIntent.amount &&
      isValidPublicKey(transactionIntent.recipient) &&
      (!transactionIntent.token || isValidPublicKey(transactionIntent.token.mint))
    );
  }, [accounts, transactionIntent]);

  // Memoized SOL transfer creation
  const createSOLTransfer = useCallback(
    (from: PublicKey, to: PublicKey, amount: string): TransactionInstruction => {
      const lamports = Math.round(parseFloat(amount) * LAMPORTS_PER_SOL);
      return SystemProgram.transfer({ fromPubkey: from, toPubkey: to, lamports });
    },
    []
  );

  // Memoized SPL transfer creation
  const createSPLTransfer = useCallback(
    async (
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
        throw new Error('Token account not found');
      }

      const senderBalance = getTokenAmount(senderInfo.value);
      if (senderBalance < parseFloat(amount)) {
        throw new Error(`Insufficient balance. Available: ${senderBalance}`);
      }

      const recipientAta = await getAssociatedTokenAddress(mintPubkey, recipientPubkey);
      const recipientInfo = await heliusConnection.getParsedAccountInfo(recipientAta);

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
        createTransferInstruction(senderAta, recipientAta, senderPubkey, BigInt(rawAmount))
      );

      return instructions;
    },
    [heliusConnection]
  );

  // Memoized execute transfer function
  const executeTransfer = useCallback(async () => {
    if (!isValidTransaction) {
      setLocalError('Invalid transaction parameters');
      setStatus('error');
      return;
    }

    setLocalError(null);
    setStatus('idle');

    try {
      const senderKey = new PublicKey(accounts![0]);
      const recipientKey = new PublicKey(transactionIntent.recipient);

      let instructions: TransactionInstruction[];

      if (!transactionIntent.token) {
        // SOL transfer
        instructions = [
          createSOLTransfer(senderKey, recipientKey, transactionIntent.amount.toString()),
        ];
      } else {
        // SPL token transfer
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
      await signAndSendTransaction(tx);

      setStatus('success');
    } catch (err: any) {
      console.error('Transaction error:', err);
      setLocalError(err.message || 'Transfer failed');
      setStatus('error');
    }
  }, [
    isValidTransaction,
    accounts,
    transactionIntent,
    createSOLTransfer,
    createSPLTransfer,
    connection,
    heliusConnection,
    signAndSendTransaction,
  ]);

  // Handle Web3Auth transaction completion
  useEffect(() => {
    if (hash && status !== 'success') {
      setStatus('success');
      if (onTransactionComplete) {
        onTransactionComplete(hash);
      }
    }
  }, [hash, onTransactionComplete, status]);

  // Handle Web3Auth errors
  useEffect(() => {
    if (error && status !== 'error') {
      setStatus('error');
      setLocalError(error.message || 'Transaction failed');
    }
  }, [error, status]);

  return {
    localError,
    status,
    executeTransfer,
    isValidTransaction,
  };
}
