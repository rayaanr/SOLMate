"use client";

import { useState, useCallback } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { QuickDepositCard } from './QuickDepositCard';
import { PaymentHistoryCard } from './PaymentHistoryCard';
import { SimplePaymentCard } from './SimplePaymentCard';
import { PaymentHistoryEntry } from '@/services/solana-pay/solana-pay-service';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Zap, History, QrCode } from 'lucide-react';

interface SolanaPayDashboardProps {
  defaultTab?: 'deposit' | 'history';
  onPaymentComplete?: (signature: string, amount: number, token?: string) => void;
}

export function SolanaPayDashboard({ 
  defaultTab = 'deposit',
  onPaymentComplete 
}: SolanaPayDashboardProps) {
  const [activeTab, setActiveTab] = useState(defaultTab);
  const [viewingPayment, setViewingPayment] = useState<PaymentHistoryEntry | null>(null);

  const handlePaymentComplete = useCallback((signature: string, amount: number, token?: string) => {
    onPaymentComplete?.(signature, amount, token);
    
    // Switch to history tab to show the completed payment
    setActiveTab('history');
  }, [onPaymentComplete]);

  const handleViewPayment = useCallback((payment: PaymentHistoryEntry) => {
    setViewingPayment(payment);
  }, []);

  const handleBackToHistory = useCallback(() => {
    setViewingPayment(null);
  }, []);

  // Show individual payment view
  if (viewingPayment) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Button
            onClick={handleBackToHistory}
            variant="outline"
            size="sm"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to History
          </Button>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Payment Details
          </h2>
        </div>
        
        {(() => {
          const MINT_TO_SYMBOL: Record<string, string> = {
            EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v: 'USDC',
            Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB: 'USDT',
            '4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R': 'RAY',
            SRMuApVNdxXokk5GT7XD5cUUgXMBCoAz2LHeuAoKWRt: 'SRM',
          };
          const tokenSymbol = viewingPayment.token
            ? MINT_TO_SYMBOL[viewingPayment.token] ?? 'SPL'
            : 'SOL';
          const splToken =
            viewingPayment.token && MINT_TO_SYMBOL[viewingPayment.token]
              ? viewingPayment.token
              : undefined;
          return (
            <SimplePaymentCard
              recipient={viewingPayment.recipient}
              amount={viewingPayment.amount}
              tokenSymbol={tokenSymbol}
              splToken={splToken}
              label={`SOLMate Payment: ${viewingPayment.amount} ${tokenSymbol}`}
              message={`Payment request for ${viewingPayment.amount} ${tokenSymbol}`}
            />
          );
        })()}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Zap className="w-8 h-8 text-blue-600 dark:text-blue-400" />
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Solana Pay
          </h1>
        </div>
        <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
          Fund your wallet instantly with QR codes and deep links. 
          Compatible with all major Solana wallets including Phantom, Solflare, and more.
        </p>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as typeof activeTab)}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="deposit" className="flex items-center gap-2">
            <Zap className="w-4 h-4" />
            Quick Deposit
          </TabsTrigger>
          <TabsTrigger value="history" className="flex items-center gap-2">
            <History className="w-4 h-4" />
            Payment History
          </TabsTrigger>
        </TabsList>

        <TabsContent value="deposit" className="space-y-6">
          <QuickDepositCard onPaymentComplete={handlePaymentComplete} />
        </TabsContent>

        <TabsContent value="history" className="space-y-6">
          <PaymentHistoryCard onViewPayment={handleViewPayment} />
        </TabsContent>
      </Tabs>

      {/* Features Section */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl p-6 border border-blue-200 dark:border-blue-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <QrCode className="w-5 h-5" />
          How Solana Pay Works
        </h3>
        <div className="grid md:grid-cols-3 gap-4 text-sm">
          <div className="space-y-2">
            <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
              <span className="text-blue-600 dark:text-blue-400 font-semibold">1</span>
            </div>
            <h4 className="font-medium text-gray-900 dark:text-white">Create Request</h4>
            <p className="text-gray-600 dark:text-gray-400">
              Select an amount and generate a QR code or payment link
            </p>
          </div>
          <div className="space-y-2">
            <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
              <span className="text-blue-600 dark:text-blue-400 font-semibold">2</span>
            </div>
            <h4 className="font-medium text-gray-900 dark:text-white">Scan & Pay</h4>
            <p className="text-gray-600 dark:text-gray-400">
              Use any Solana wallet to scan the QR code or open the payment link
            </p>
          </div>
          <div className="space-y-2">
            <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
              <span className="text-blue-600 dark:text-blue-400 font-semibold">3</span>
            </div>
            <h4 className="font-medium text-gray-900 dark:text-white">Instant Confirmation</h4>
            <p className="text-gray-600 dark:text-gray-400">
              Receive real-time confirmation when the payment is complete
            </p>
          </div>
        </div>
      </div>

      {/* Supported Wallets */}
      <div className="text-center">
        <h4 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-3">
          Compatible Wallets
        </h4>
        <div className="flex items-center justify-center gap-4 text-xs text-gray-500 dark:text-gray-400">
          <span>Phantom</span>
          <span>•</span>
          <span>Solflare</span>
          <span>•</span>
          <span>Glow</span>
          <span>•</span>
          <span>Slope</span>
          <span>•</span>
          <span>Backpack</span>
        </div>
      </div>
    </div>
  );
}
