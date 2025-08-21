"use client";

import {
  useWeb3AuthConnect,
  useWeb3AuthDisconnect,
} from "@web3auth/modal/react";
import { Button } from "./ui/button";
import { useUserWallet } from "@/contexts/UserWalletContext";
import Link from "next/link";
import { MessageCircle, Zap } from "lucide-react";

const Navbar = () => {
  const { disconnect } = useWeb3AuthDisconnect();
  const { connect, isConnected } = useWeb3AuthConnect();
  const { userWallet } = useUserWallet();

  const formatAddress = (address: string | undefined) => {
    if (!address) return "";
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  return (
    <nav className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo/Brand */}
          <div className="flex items-center">
            <Link href="/" className="flex-shrink-0">
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                SOLMate
              </h1>
            </Link>
          </div>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center space-x-8">
            <Link 
              href="/chat" 
              className="flex items-center gap-2 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              <MessageCircle className="h-4 w-4" />
              Chat
            </Link>
            <Link 
              href="/solana-pay" 
              className="flex items-center gap-2 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              <Zap className="h-4 w-4" />
              Solana Pay
            </Link>
          </div>

          {/* Wallet Connection */}
          <div className="flex items-center space-x-4">
            {isConnected && userWallet && (
              <span className="text-sm text-gray-700 dark:text-gray-300 truncate">
                {formatAddress(userWallet)}
              </span>
            )}
            <Button
              onClick={isConnected ? () => disconnect() : () => connect()}
              variant={isConnected ? "destructive" : "default"}
              size="sm"
            >
              {isConnected ? "Disconnect" : "Connect Wallet"}
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
