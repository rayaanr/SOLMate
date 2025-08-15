"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useSolanaWallet } from '@web3auth/modal/react/solana';

interface UserWalletContextType {
  userWallet: string | undefined;
  isConnected: boolean;
  accounts: string[] | null | undefined;
}

const UserWalletContext = createContext<UserWalletContextType | undefined>(undefined);

export function UserWalletProvider({ children }: { children: React.ReactNode }) {
  const { accounts } = useSolanaWallet();
  const [userWallet, setUserWallet] = useState<string | undefined>(undefined);

  useEffect(() => {
    const newUserWallet = accounts && accounts.length > 0 ? accounts[0] : undefined;
    setUserWallet(newUserWallet);
  }, [accounts]);

  const isConnected = Boolean(userWallet);

  const value: UserWalletContextType = {
    userWallet,
    isConnected,
    accounts,
  };

  return (
    <UserWalletContext.Provider value={value}>
      {children}
    </UserWalletContext.Provider>
  );
}

export function useUserWallet(): UserWalletContextType {
  const context = useContext(UserWalletContext);
  if (context === undefined) {
    throw new Error('useUserWallet must be used within a UserWalletProvider');
  }
  return context;
}

// Export the context for testing purposes
export { UserWalletContext };
