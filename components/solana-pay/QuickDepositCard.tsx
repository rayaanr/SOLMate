"use client";

import { useState, useCallback } from "react";
import { Plus, Zap, DollarSign, Coins } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SimplePaymentCard } from "./SimplePaymentCard";
import { QUICK_DEPOSIT_PRESETS } from "@/services/solana-pay/solana-pay-service";
import { useUserWallet } from "@/contexts/UserWalletContext";
import { TOKENS } from "@/data/tokens";

interface QuickDepositCardProps {
  onPaymentComplete?: (
    signature: string,
    amount: number,
    token?: string
  ) => void;
}

export function QuickDepositCard({ onPaymentComplete }: QuickDepositCardProps) {
  const [selectedPreset, setSelectedPreset] = useState<
    (typeof QUICK_DEPOSIT_PRESETS)[0] | null
  >(null);
  const [customAmount, setCustomAmount] = useState("");
  const [customToken, setCustomToken] = useState("SOL");
  const [showCustom, setShowCustom] = useState(false);
  const [showPaymentRequest, setShowPaymentRequest] = useState(false);
  const [paymentConfig, setPaymentConfig] = useState<{
    amount: number;
    token: string;
    splToken?: string;
  } | null>(null);

  const { userWallet } = useUserWallet();

  const handlePresetSelect = useCallback(
    (preset: (typeof QUICK_DEPOSIT_PRESETS)[0]) => {
      if (!userWallet) return;

      setSelectedPreset(preset);
      setPaymentConfig({
        amount: preset.amount,
        token: preset.token || "SOL",
        splToken: getSplTokenMint(preset.token),
      });
      setShowPaymentRequest(true);
    },
    [userWallet]
  );

  const handleCustomDeposit = useCallback(() => {
    if (!userWallet || !customAmount) return;

    const amount = parseFloat(customAmount);
    if (isNaN(amount) || amount <= 0) return;

    setPaymentConfig({
      amount,
      token: customToken,
      splToken: getSplTokenMint(customToken === "SOL" ? null : customToken),
    });
    setShowPaymentRequest(true);
  }, [userWallet, customAmount, customToken]);

  const getSplTokenMint = (tokenSymbol: string | null): string | undefined => {
    const tokenMints: Record<string, string> = {
      USDC: TOKENS.USDC.address,
      USDT: TOKENS.USDT.address,
      RAY: TOKENS.RAY.address,
      BONK: TOKENS.BONK.address,
      ONESOL: TOKENS.ONESOL.address,
    };

    return tokenSymbol ? tokenMints[tokenSymbol] : undefined;
  };

  const handlePaymentComplete = useCallback(
    (signature: string) => {
      if (paymentConfig) {
        onPaymentComplete?.(
          signature,
          paymentConfig.amount,
          paymentConfig.token
        );
      }

      // Reset state
      setShowPaymentRequest(false);
      setPaymentConfig(null);
      setSelectedPreset(null);
      setCustomAmount("");
    },
    [paymentConfig, onPaymentComplete]
  );

  const handleBack = useCallback(() => {
    setShowPaymentRequest(false);
    setPaymentConfig(null);
    setSelectedPreset(null);
  }, []);

  // Show payment request if configured
  if (showPaymentRequest && paymentConfig && userWallet) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Button onClick={handleBack} variant="outline" size="sm">
            ← Back
          </Button>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Quick Deposit: {paymentConfig.amount} {paymentConfig.token}
          </h3>
        </div>

        <SimplePaymentCard
          recipient={userWallet}
          amount={paymentConfig.amount}
          tokenSymbol={paymentConfig.token}
          splToken={paymentConfig.splToken}
          label={`SOLMate Quick Deposit`}
          message={`Deposit ${paymentConfig.amount} ${paymentConfig.token} to your SOLMate wallet`}
          onPaymentComplete={handlePaymentComplete}
        />
      </div>
    );
  }

  if (!userWallet) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <div className="text-center">
          <Zap className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Connect Wallet for Quick Deposits
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            Connect your wallet to use Solana Pay for quick deposits
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 space-y-6">
      {/* Header */}
      <div className="text-center">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Zap className="w-6 h-6 text-blue-600 dark:text-blue-400" />
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
            Quick Deposit
          </h3>
        </div>
        <p className="text-gray-600 dark:text-gray-400">
          Fund your wallet instantly with Solana Pay
        </p>
      </div>

      {/* Wallet Info */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg p-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
            <DollarSign className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Deposit to
            </p>
            <p className="font-mono text-sm text-gray-900 dark:text-white">
              {userWallet.slice(0, 8)}...{userWallet.slice(-8)}
            </p>
          </div>
        </div>
      </div>

      {/* Preset Amounts */}
      <div>
        <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <Coins className="w-5 h-5" />
          Quick Amounts
        </h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {QUICK_DEPOSIT_PRESETS.map((preset, index) => (
            <Button
              key={index}
              onClick={() => handlePresetSelect(preset)}
              variant="outline"
              className="h-auto py-3 px-4 flex flex-col items-center gap-1 hover:bg-blue-50 hover:border-blue-300 dark:hover:bg-blue-900/20 dark:hover:border-blue-700"
            >
              <span className="font-semibold text-sm">{preset.amount}</span>
              <span className="text-xs text-gray-600 dark:text-gray-400">
                {preset.token || "SOL"}
              </span>
            </Button>
          ))}
        </div>
      </div>

      {/* Custom Amount Toggle */}
      <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
        <Button
          onClick={() => setShowCustom(!showCustom)}
          variant="outline"
          className="w-full flex items-center justify-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Custom Amount
        </Button>
      </div>

      {/* Custom Amount Form */}
      {showCustom && (
        <div className="space-y-4 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label
                htmlFor="amount"
                className="text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Amount
              </Label>
              <Input
                id="amount"
                type="number"
                placeholder="Enter amount"
                value={customAmount}
                onChange={(e) => setCustomAmount(e.target.value)}
                className="mt-1"
                min="0"
                step="any"
              />
            </div>
            <div>
              <Label
                htmlFor="token"
                className="text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Token
              </Label>
              <Select value={customToken} onValueChange={setCustomToken}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="SOL">SOL</SelectItem>
                  <SelectItem value="USDC">USDC</SelectItem>
                  <SelectItem value="USDT">USDT</SelectItem>
                  <SelectItem value="RAY">RAY</SelectItem>
                  <SelectItem value="SRM">SRM</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button
            onClick={handleCustomDeposit}
            className="w-full"
            disabled={!customAmount || parseFloat(customAmount) <= 0}
          >
            Create Payment Request
          </Button>
        </div>
      )}

      {/* Footer */}
      <div className="text-center text-xs text-gray-500 dark:text-gray-400 border-t border-gray-200 dark:border-gray-700 pt-4">
        <p>✓ Instant deposits with Solana Pay</p>
        <p>✓ Compatible with all Solana wallets</p>
        <p>✓ Secure and decentralized</p>
      </div>
    </div>
  );
}
