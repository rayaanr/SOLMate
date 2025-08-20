"use client";

import { useState, useEffect } from 'react';
import { History, Clock, CheckCircle, XCircle, ExternalLink, QrCode } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { 
  getAllPaymentRequests, 
  clearExpiredPaymentRequests,
  PaymentHistoryEntry 
} from '@/services/solana-pay/solana-pay-service';

interface PaymentHistoryCardProps {
  onViewPayment?: (payment: PaymentHistoryEntry) => void;
}

export function PaymentHistoryCard({ onViewPayment }: PaymentHistoryCardProps) {
  const [payments, setPayments] = useState<PaymentHistoryEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load payment history
  useEffect(() => {
    const loadPayments = () => {
      setIsLoading(true);
      try {
        // Clear expired payments first
        clearExpiredPaymentRequests();
        
        // Get all payment requests
        const allPayments = getAllPaymentRequests();
        setPayments(allPayments);
      } catch (error) {
        console.error('Failed to load payment history:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadPayments();

    // Refresh every 30 seconds
    const interval = setInterval(loadPayments, 30000);

    return () => clearInterval(interval);
  }, []);

  const getStatusIcon = (status: PaymentHistoryEntry['status']) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'confirmed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'expired':
        return <XCircle className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusText = (status: PaymentHistoryEntry['status']) => {
    switch (status) {
      case 'pending':
        return 'Pending';
      case 'confirmed':
        return 'Confirmed';
      case 'failed':
        return 'Failed';
      case 'expired':
        return 'Expired';
    }
  };

  const getStatusColor = (status: PaymentHistoryEntry['status']) => {
    switch (status) {
      case 'pending':
        return 'text-yellow-600 dark:text-yellow-400';
      case 'confirmed':
        return 'text-green-600 dark:text-green-400';
      case 'failed':
        return 'text-red-600 dark:text-red-400';
      case 'expired':
        return 'text-gray-600 dark:text-gray-400';
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };

  const formatRecipient = (recipient: string) => {
    return `${recipient.slice(0, 8)}...${recipient.slice(-8)}`;
  };

  const openSolanaExplorer = (signature: string) => {
    window.open(`https://solscan.io/tx/${signature}`, '_blank');
  };

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-gray-600 dark:text-gray-400">Loading payment history...</span>
        </div>
      </div>
    );
  }

  if (payments.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <div className="text-center py-8">
          <History className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            No Payment History
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            Your Solana Pay payment requests will appear here
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <History className="w-6 h-6 text-blue-600 dark:text-blue-400" />
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
            Payment History
          </h3>
        </div>
        <div className="text-sm text-gray-600 dark:text-gray-400">
          {payments.length} request{payments.length !== 1 ? 's' : ''}
        </div>
      </div>

      {/* Desktop Table */}
      <div className="hidden md:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Status</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Recipient</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {payments.map((payment) => (
              <TableRow key={payment.id}>
                <TableCell>
                  <div className="flex items-center gap-2">
                    {getStatusIcon(payment.status)}
                    <span className={getStatusColor(payment.status)}>
                      {getStatusText(payment.status)}
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="font-medium">
                    {payment.amount} {payment.token || 'SOL'}
                  </div>
                </TableCell>
                <TableCell>
                  <code className="text-xs bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                    {formatRecipient(payment.recipient)}
                  </code>
                </TableCell>
                <TableCell>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    {formatDate(payment.timestamp)}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    {payment.signature && (
                      <Button
                        onClick={() => openSolanaExplorer(payment.signature!)}
                        variant="outline"
                        size="sm"
                        className="h-8 px-2"
                      >
                        <ExternalLink className="w-3 h-3" />
                      </Button>
                    )}
                    <Button
                      onClick={() => onViewPayment?.(payment)}
                      variant="outline"
                      size="sm"
                      className="h-8 px-2"
                    >
                      <QrCode className="w-3 h-3" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden space-y-4">
        {payments.map((payment) => (
          <div
            key={payment.id}
            className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 space-y-3"
          >
            {/* Status and Amount */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {getStatusIcon(payment.status)}
                <span className={`font-medium ${getStatusColor(payment.status)}`}>
                  {getStatusText(payment.status)}
                </span>
              </div>
              <div className="font-semibold">
                {payment.amount} {payment.token || 'SOL'}
              </div>
            </div>

            {/* Recipient */}
            <div>
              <div className="text-xs text-gray-600 dark:text-gray-400">Recipient</div>
              <code className="text-xs bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                {formatRecipient(payment.recipient)}
              </code>
            </div>

            {/* Date */}
            <div className="text-xs text-gray-600 dark:text-gray-400">
              {formatDate(payment.timestamp)}
            </div>

            {/* Actions */}
            <div className="flex gap-2 pt-2">
              {payment.signature && (
                <Button
                  onClick={() => openSolanaExplorer(payment.signature!)}
                  variant="outline"
                  size="sm"
                  className="flex-1"
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  View Transaction
                </Button>
              )}
              <Button
                onClick={() => onViewPayment?.(payment)}
                variant="outline"
                size="sm"
                className="flex-1"
              >
                <QrCode className="w-4 h-4 mr-2" />
                View QR
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700 text-center">
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Payment requests expire after 10 minutes
        </p>
      </div>
    </div>
  );
}
