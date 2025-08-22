import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Provider from "./provider";
// IMP START - SSR
import { cookieToWeb3AuthState } from "@web3auth/modal";
import "./globals.css";
import { headers } from "next/headers";
import { TopNav } from "@/components/TopNav";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "SOLMate - Your Solana AI Assistant",
  description: "AI-powered assistant for Solana blockchain interactions",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const headersList = await headers();
  const web3authInitialState = cookieToWeb3AuthState(headersList.get("cookie"));
  return (
    <html lang="en" className="h-full">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased h-full m-0 p-0 overflow-hidden`}
      >
        <Provider web3authInitialState={web3authInitialState}>
          <TopNav />
          {children}
        </Provider>
      </body>
    </html>
  );
}
