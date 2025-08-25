"use client";

import Link from "next/link";
import { Heart, Github, Twitter } from "lucide-react";

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto max-w-7xl px-4 py-8">
        <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
          {/* Left side - Brand */}
          <div className="flex items-center space-x-2">
            <span className="text-lg font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              SOLMate
            </span>
            <span className="text-sm text-muted-foreground">
              AI-powered Solana assistant
            </span>
          </div>

          {/* Center - Links */}
          <div className="flex items-center space-x-6 text-sm">
            <Link
              href="/chat"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              Chat
            </Link>
            <Link
              href="#features"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              Features
            </Link>
            <Link
              href="#about"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              About
            </Link>
          </div>

          {/* Right side - Social links and copyright */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Link
                href="https://github.com/rayaanr/SOLMate"
                className="text-muted-foreground hover:text-foreground transition-colors"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Github className="h-4 w-4" />
                <span className="sr-only">GitHub</span>
              </Link>
              <Link
                href="https://twitter.com"
                className="text-muted-foreground hover:text-foreground transition-colors"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Twitter className="h-4 w-4" />
                <span className="sr-only">Twitter</span>
              </Link>
            </div>
            <div className="flex items-center text-xs text-muted-foreground">
              <span>© {currentYear} Built with</span>
              <Heart className="h-3 w-3 mx-1 text-red-500" />
              <span>for Solana</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
