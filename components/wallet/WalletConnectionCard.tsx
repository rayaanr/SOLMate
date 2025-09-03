"use client";

import { useWeb3AuthConnect } from "@web3auth/modal/react";
import { Button } from "../ui/button";
import { Wallet, Loader2, CheckCircle2, Copy } from "lucide-react";
import { useState } from "react";
import { useUserWallet } from "@/contexts/UserWalletContext";

interface WalletConnectionData {
  action: string;
  reason: string;
}

interface WalletConnectionCardProps {
  walletConnectionData?: WalletConnectionData;
}

export function WalletConnectionCard({ walletConnectionData }: WalletConnectionCardProps) {
  const [connecting, setConnecting] = useState(false);
  const { connect } = useWeb3AuthConnect();
  const { userWallet } = useUserWallet();

  const handleConnectWallet = async () => {
    try {
      setConnecting(true);
      await connect();
    } catch (error) {
      console.error("Failed to connect wallet:", error);
    } finally {
      setConnecting(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    // Simple toast notification
    const toast = document.createElement("div");
    toast.textContent = "Address copied to clipboard!";
    toast.className =
      "fixed top-20 right-4 bg-green-500 text-white px-4 py-2 rounded-md shadow-lg z-50";
    document.body.appendChild(toast);
    setTimeout(() => {
      document.body.removeChild(toast);
    }, 2000);
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 4)}...${address.slice(-4)}`;
  };

  const actionText = walletConnectionData?.action || "this action";

  // If wallet is connected, show success state
  if (userWallet) {
    return (
      <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border border-green-200 dark:border-green-700 rounded-xl p-6">
        <div className="flex items-center space-x-3 mb-4">
          <CheckCircle2 className="w-6 h-6 text-green-600 dark:text-green-400" />
          <h3 className="text-lg font-semibold text-green-900 dark:text-green-100">
            Wallet Connected Successfully!
          </h3>
        </div>
        
        <p className="text-green-700 dark:text-green-300 mb-4">
          Great! Your wallet is now connected and ready for {actionText}. You can now retry your request.
        </p>

        <div className="flex items-center justify-between bg-white/50 dark:bg-black/20 rounded-lg p-3 border border-green-200 dark:border-green-700">
          <div className="flex items-center space-x-2">
            <Wallet className="w-4 h-4 text-green-600 dark:text-green-400" />
            <span className="text-green-700 dark:text-green-300 font-mono text-sm">
              {formatAddress(userWallet)}
            </span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => copyToClipboard(userWallet)}
            className="text-green-600 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300"
          >
            <Copy className="w-4 h-4" />
          </Button>
        </div>
      </div>
    );
  }

  // If wallet is not connected, show connection prompt
  return (
    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-700 rounded-xl p-6">
      <div className="flex items-center space-x-3 mb-4">
        <Wallet className="w-6 h-6 text-blue-600 dark:text-blue-400" />
        <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100">
          Wallet Connection Required
        </h3>
      </div>
      
      <p className="text-blue-700 dark:text-blue-300 mb-6">
        To proceed with {actionText}, please connect your wallet first. This allows us to interact with the Solana blockchain on your behalf.
      </p>

      <div className="flex justify-center">
        <Button
          onClick={handleConnectWallet}
          disabled={connecting}
          className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-2 font-medium"
        >
          {connecting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
              Connecting...
            </>
          ) : (
            <>
              <Wallet className="w-4 h-4 mr-2" />
              Connect Wallet
            </>
          )}
        </Button>
      </div>
    </div>
  );
}