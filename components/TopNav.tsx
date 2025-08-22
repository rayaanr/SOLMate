"use client";

import { Button } from "@/components/ui/button";
import { MessageSquare, Plus, Wallet, Copy, LogOut, Menu } from "lucide-react";
import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  useWeb3AuthConnect,
  useWeb3AuthDisconnect,
} from "@web3auth/modal/react";
import { useUserWallet } from "@/contexts/UserWalletContext";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

type TopNavProps = {
  className?: string;
};

export function TopNav({ className }: TopNavProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [connecting, setConnecting] = useState(false);

  // Real wallet integration
  const { connect, isConnected } = useWeb3AuthConnect();
  const { disconnect } = useWeb3AuthDisconnect();
  const { userWallet } = useUserWallet();
  const pathname = usePathname();
  const router = useRouter();
  const isChatPage = pathname === "/chat";

  const handleNewChat = () => {
    // Always navigate to chat with a new UUID to force a fresh chat
    const newChatId = crypto.randomUUID();
    router.push(`/chat?id=${newChatId}`);
    setIsMobileMenuOpen(false);
  };

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

  const handleDisconnectWallet = async () => {
    try {
      await disconnect();
    } catch (error) {
      console.error("Failed to disconnect wallet:", error);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    // Simple toast notification - you can replace with a proper toast library
    const toast = document.createElement("div");
    toast.textContent = "Address copied to clipboard!";
    toast.className =
      "fixed top-20 right-4 bg-green-500 text-white px-4 py-2 rounded-md shadow-lg z-50";
    document.body.appendChild(toast);
    setTimeout(() => {
      document.body.removeChild(toast);
    }, 2000);
  };

  const formatAddress = (address: string | undefined) => {
    if (!address) return "";
    return `${address.slice(0, 4)}...${address.slice(-4)}`;
  };

  return (
    <motion.nav
      className={cn(
        "sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-sm",
        className
      )}
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
    >
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4">
        {/* Logo/Brand */}
        <div className="flex items-center gap-2">
          <Link href="/" className="flex items-center gap-2">
            <MessageSquare className="h-6 w-6 text-primary" />
            <span className="text-lg font-semibold">SOLMate</span>
          </Link>
        </div>

        {/* Desktop Navigation */}
        <div className="hidden items-center gap-2 md:flex">
          <Button
            variant="ghost"
            size="sm"
            className="gap-2"
            onClick={handleNewChat}
          >
            <Plus className="h-4 w-4" />
            New Chat
          </Button>

          {/* Wallet Connection */}
          {!isConnected ? (
            <Button
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={handleConnectWallet}
              disabled={connecting}
            >
              <Wallet className="h-4 w-4" />
              {connecting ? "Connecting..." : "Connect Wallet"}
            </Button>
          ) : (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  <Wallet className="h-4 w-4" />
                  {formatAddress(userWallet)}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem
                  onClick={() => copyToClipboard(userWallet || "")}
                >
                  <Copy className="mr-2 h-4 w-4" />
                  Copy Address
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleDisconnectWallet}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Disconnect
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        {/* Mobile Menu Button */}
        <div className="flex items-center gap-2 md:hidden">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            <Menu className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            className="border-t bg-background md:hidden"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div className="space-y-2 p-4">
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start gap-2"
                onClick={handleNewChat}
              >
                <Plus className="h-4 w-4" />
                New Chat
              </Button>

              {/* Mobile Wallet Connection */}
              {!isConnected ? (
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-start gap-2"
                  onClick={handleConnectWallet}
                  disabled={connecting}
                >
                  <Wallet className="h-4 w-4" />
                  {connecting ? "Connecting..." : "Connect Wallet"}
                </Button>
              ) : (
                <div className="space-y-1 border-t pt-2">
                  <div className="flex items-center gap-2 px-3 py-2 text-sm">
                    <Wallet className="h-4 w-4" />
                    <span className="font-medium">Connected:</span>
                    <span className="text-muted-foreground">
                      {formatAddress(userWallet)}
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start gap-2"
                    onClick={() => copyToClipboard(userWallet || "")}
                  >
                    <Copy className="h-4 w-4" />
                    Copy Address
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start gap-2"
                    onClick={handleDisconnectWallet}
                  >
                    <LogOut className="h-4 w-4" />
                    Disconnect Wallet
                  </Button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
}
