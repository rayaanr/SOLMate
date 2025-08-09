"use client";

import React, { useEffect } from "react";
import { useWeb3Auth } from "@web3auth/modal/react";
import { useAccount, useDisconnect } from "wagmi";

const Navbar = () => {
  const { isConnected, web3Auth } = useWeb3Auth();
  const { isConnected: isWagmiConnected } = useAccount();
  const { disconnect } = useDisconnect();
  const [userInfo, setUserInfo] = React.useState<any>(null);
  const [isInitialized, setIsInitialized] = React.useState(false);

  // Check if Web3Auth is initialized
  useEffect(() => {
    if (web3Auth) {
      setIsInitialized(true);
      console.log("Web3Auth initialized:", web3Auth.status || "status unknown");
    }
  }, [web3Auth]);

  const handleConnect = async () => {
    try {
      if (web3Auth && isInitialized && !isConnected) {
        await web3Auth.connect();
        // Wait a moment for the connection to fully establish
        await new Promise((resolve) => setTimeout(resolve, 500));
      }
    } catch (error) {
      console.error("Connection failed:", error);
    }
  };

  const handleDisconnect = async () => {
    try {
      if (isWagmiConnected) {
        disconnect();
      }
      if (web3Auth && isConnected) {
        await web3Auth.logout();
      }
    } catch (error) {
      console.error("Disconnect failed:", error);
    }
  };

  // Get user info only when connected and initialized
  useEffect(() => {
    const getUserInfo = async () => {
      // More comprehensive checks before calling getUserInfo
      if (web3Auth && isConnected && isInitialized) {
        try {
          // Check if web3Auth has a provider (indicates actual connection)
          if (!web3Auth.provider) {
            console.log("Web3Auth provider not available yet");
            setUserInfo(null);
            return;
          }

          console.log("Attempting to get user info...");
          const info = await web3Auth.getUserInfo();
          console.log("User info retrieved:", info);
          setUserInfo(info);
        } catch (error) {
          console.error("Failed to get user info:", error);
          // Only show wallet not connected error if it's actually that error
          if (
            error instanceof Error &&
            error.message.includes("Wallet is not connected")
          ) {
            console.log("Wallet not fully connected yet, will retry...");
          }
          setUserInfo(null);
        }
      } else {
        console.log("Conditions not met:", {
          web3Auth: !!web3Auth,
          isConnected,
          isInitialized,
        });
        setUserInfo(null);
      }
    };

    // Only try to get user info if isConnected is true
    if (isConnected) {
      // Add a delay to ensure the connection is fully established
      const timeoutId = setTimeout(getUserInfo, 300);
      return () => clearTimeout(timeoutId);
    } else {
      setUserInfo(null);
    }
  }, [isConnected, web3Auth, isInitialized]);

  // Additional effect to monitor Web3Auth state changes
  useEffect(() => {
    if (web3Auth) {
      const handleStateChange = () => {
        console.log("Web3Auth state changed");
        if (isConnected && web3Auth.provider) {
          // Retry getting user info when state changes
          setTimeout(async () => {
            try {
              const info = await web3Auth.getUserInfo();
              setUserInfo(info);
            } catch (error) {
              console.log("Still not ready for user info");
            }
          }, 500);
        }
      };

      // Listen for any changes in web3Auth (if it has event listeners)
      if (typeof web3Auth.on === "function") {
        web3Auth.on("connected", handleStateChange);
        return () => {
          if (typeof web3Auth.off === "function") {
            web3Auth.off("connected", handleStateChange);
          }
        };
      }
    }
  }, [web3Auth, isConnected]);

  return (
    <nav className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo/Brand */}
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                SOL Sensei
              </h1>
            </div>
          </div>

          {/* Wallet Connection */}
          <div className="flex items-center space-x-4">
            {isConnected ? (
              <div className="flex items-center space-x-3">
                {userInfo && (
                  <div className="flex items-center space-x-2">
                    {userInfo.profileImage && (
                      <img
                        src={userInfo.profileImage}
                        alt="Profile"
                        className="w-8 h-8 rounded-full"
                      />
                    )}
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300 hidden sm:block">
                      {userInfo.name || userInfo.email || "Anonymous"}
                    </span>
                  </div>
                )}
                <button
                  onClick={handleDisconnect}
                  className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                >
                  Disconnect
                </button>
              </div>
            ) : (
              <button
                onClick={handleConnect}
                disabled={!isInitialized}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                  isInitialized
                    ? "bg-blue-600 hover:bg-blue-700 text-white focus:ring-blue-500"
                    : "bg-gray-400 cursor-not-allowed text-gray-200"
                }`}
              >
                {isInitialized ? "Connect Wallet" : "Initializing..."}
              </button>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              type="button"
              className="bg-gray-800 inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-white hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-white"
              aria-controls="mobile-menu"
              aria-expanded="false"
            >
              <span className="sr-only">Open main menu</span>
              {/* Hamburger icon */}
              <svg
                className="block h-6 w-6"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
