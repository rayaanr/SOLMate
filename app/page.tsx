"use client";

import { motion } from "motion/react";
import { 
  SLIDE_UP_VARIANTS, 
  SCALE_VARIANTS, 
  TRANSITION_DEFAULT,
  TRANSITION_SLOW
} from "@/lib/motion";
import { Button } from "@/components/ui/button";
import { ArrowRight, Wallet, MessageSquare, Zap, Shield } from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";

export default function Home() {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted pt-14">
      <div className="container mx-auto px-4 py-16">
        {/* Hero Section */}
        <motion.div
          className="text-center max-w-3xl mx-auto mb-20"
          initial="initial"
          animate="animate"
          variants={SLIDE_UP_VARIANTS}
          transition={{ ...TRANSITION_SLOW, delay: 0.1 }}
        >
          <motion.div
            className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm mb-6"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...TRANSITION_DEFAULT, delay: 0.2 }}
          >
            <Zap className="h-4 w-4" />
            <span>Powered by AI</span>
          </motion.div>
          
          <motion.h1 
            className="text-4xl md:text-6xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-primary to-blue-600"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...TRANSITION_DEFAULT, delay: 0.3 }}
          >
            Your Solana AI Assistant
          </motion.h1>
          
          <motion.p 
            className="text-xl text-muted-foreground mb-10"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...TRANSITION_DEFAULT, delay: 0.4 }}
          >
            Interact with the Solana blockchain through natural language. Send transactions, 
            swap tokens, and explore your portfolio with ease.
          </motion.p>
          
          <motion.div
            className="flex flex-col sm:flex-row gap-4 justify-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...TRANSITION_DEFAULT, delay: 0.5 }}
          >
            <Button size="lg" asChild className="gap-2">
              <Link href="/chat">
                Start Chatting <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild className="gap-2">
              <Link href="#features">
                Learn More <MessageSquare className="h-4 w-4" />
              </Link>
            </Button>
          </motion.div>
        </motion.div>

        {/* Features Grid */}
        <motion.div 
          className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-20"
          id="features"
          initial="initial"
          animate="animate"
          variants={SLIDE_UP_VARIANTS}
          transition={{ ...TRANSITION_SLOW, delay: 0.6 }}
        >
          {[
            {
              icon: Wallet,
              title: "Wallet Integration",
              description: "Securely connect your Solana wallet to interact with the blockchain directly through chat."
            },
            {
              icon: Zap,
              title: "Instant Transactions",
              description: "Execute token swaps, transfers, and other transactions with simple natural language commands."
            },
            {
              icon: Shield,
              title: "AI-Powered Security",
              description: "Built-in transaction review and security checks to protect your assets."
            }
          ].map((feature, index) => (
            <motion.div
              key={index}
              className="bg-card border rounded-xl p-6 text-center hover:shadow-lg transition-shadow"
              variants={SCALE_VARIANTS}
              transition={{ ...TRANSITION_DEFAULT, delay: 0.7 + index * 0.1 }}
              whileHover={{ y: -5 }}
            >
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 text-primary mb-4">
                <feature.icon className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
              <p className="text-muted-foreground">{feature.description}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </div>
  );
}