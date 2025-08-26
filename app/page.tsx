"use client";

import { Button } from "@/components/ui/button";
import { ArrowRight, Heart } from "lucide-react";
import Link from "next/link";
import { BackgroundLines } from "@/components/ui/background-lines";
import { BentoGrid } from "@/components/grid";

const currentYear = new Date().getFullYear();

export default function Home() {
  return (
    <div className="min-h-screen pb-8">
      <div className="">
        <BackgroundLines className="flex items-center justify-center w-full flex-col px-4">
          <h2 className="bg-clip-text text-transparent text-center bg-gradient-to-b from-neutral-900 to-neutral-700 dark:from-neutral-600 dark:to-white text-2xl md:text-5xl lg:text-7xl font-sans py-2 md:py-10 relative z-20 font-bold tracking-tight">
            The AI that speaks your <br /> wallet's language.
          </h2>
          <p className="max-w-xl mx-auto text-sm md:text-lg text-neutral-700 dark:text-neutral-400 text-center">
            Check your wallet, explore NFTs, review history, swap tokens, and
            send or receive assets — all with one AI chat.
          </p>
          <Button size="lg" asChild className="mt-10 z-10">
            <Link href="/chat">
              Chat With Your Wallet <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </BackgroundLines>
        {/* Features Grid */}
        <h3 className="text-center text-3xl font-bold mb-4">Features</h3>
        <p className="text-center text-sm md:text-lg text-neutral-700 dark:text-neutral-400 mb-8">
          Powerful tools to simplify your Solana journey
        </p>
        <BentoGrid />

        <footer>
          <div className="mx-auto max-w-7xl px-4 pb-4 pt-16">
            <div className="flex flex-col items-center justify-center gap-4 md:flex-row">
              <div className="flex items-center text-xs text-muted-foreground">
                <span>© {currentYear} Built with</span>
                <Heart className="h-3 w-3 mx-1 text-red-500" />
                <span>
                  by{" "}
                  <Link
                    className="text-muted-foreground hover:text-[#0066FF] transition-colors"
                    href="https://rayaanr.com/"
                  >
                    Rayaan
                  </Link>
                </span>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
