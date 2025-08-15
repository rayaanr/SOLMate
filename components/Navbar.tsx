"use client";

import {
  useWeb3AuthConnect,
  useWeb3AuthDisconnect,
} from "@web3auth/modal/react";
import { Button } from "./ui/button";
import { useSolanaWallet } from "@web3auth/modal/react/solana";

const Navbar = () => {
  const { disconnect } = useWeb3AuthDisconnect();
  const { connect, isConnected } = useWeb3AuthConnect();
  const { accounts } = useSolanaWallet();

  return (
    <nav className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo/Brand */}
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                SOLMate
              </h1>
            </div>
          </div>

          {/* Wallet Connection */}
          <div className="flex items-center space-x-4">
            {isConnected && accounts && (
              <span className="text-sm text-gray-700 dark:text-gray-300 truncate">
                {accounts[0] || "User"}
              </span>
            )}
            <Button
              onClick={isConnected ? () => disconnect() : () => connect()}
              variant={isConnected ? "destructive" : "default"}
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
