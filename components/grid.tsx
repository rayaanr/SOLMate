"use client";
import { cn } from "@/lib/utils";
import React from "react";
import {
  IconBoxAlignRightFilled,
  IconClipboardCopy,
  IconFileBroken,
  IconSignature,
  IconTableColumn,
} from "@tabler/icons-react";
import { motion } from "motion/react";
import { BentoGrid as Bento, BentoGridItem } from "./ui/bento-grid";
import QRCode from "react-qr-code";

export function BentoGrid() {
  return (
    <Bento className="w-full md:auto-rows-[20rem] px-14">
      {items.map((item, i) => (
        <BentoGridItem
          key={i}
          title={item.title}
          description={item.description}
          header={item.header}
          className={cn("[&>p:text-lg]", item.className)}
          icon={item.icon}
        />
      ))}
    </Bento>
  );
}

const SkeletonOne = () => {
  const variants = {
    initial: {
      x: 0,
    },
    animate: {
      x: 10,
      rotate: 5,
      transition: {
        duration: 0.2,
      },
    },
  };
  const variantsSecond = {
    initial: {
      x: 0,
    },
    animate: {
      x: -10,
      rotate: -5,
      transition: {
        duration: 0.2,
      },
    },
  };

  return (
    <motion.div
      initial="initial"
      whileHover="animate"
      className="flex flex-1 w-full h-full min-h-[6rem] dark:bg-dot-white/[0.2] bg-dot-black/[0.2] flex-col space-y-2"
    >
      <motion.div
        variants={variants}
        className="flex flex-row rounded-2xl border border-neutral-100 dark:border-white/[0.2] p-2 items-start space-x-2 bg-white dark:bg-black"
      >
        <img
          src="/avatar.png"
          alt="User"
          className="h-6 w-6 rounded-full shrink-0 mt-0.5"
        />
        <p className="text-xs text-neutral-600 dark:text-neutral-400">
          Show me my SOL balance and recent transactions
        </p>
      </motion.div>
      <motion.div
        variants={variantsSecond}
        className="flex flex-row rounded-2xl border border-neutral-100 dark:border-white/[0.2] p-2 items-start space-x-2 w-4/5 ml-auto bg-white dark:bg-black"
      >
        <img
          src="/icon.svg"
          alt="AI Assistant"
          className="size-6 shrink-0 mt-2"
        />
        <div className="flex flex-col space-y-1">
          <p className="text-xs text-neutral-600 dark:text-neutral-400">
            You have 12.45 SOL (~$1,867)
          </p>
          <p className="text-[10px] text-neutral-500">
            Last transaction: +2.3 SOL received
          </p>
        </div>
      </motion.div>
      <motion.div
        variants={variants}
        className="flex flex-row rounded-2xl border border-neutral-100 dark:border-white/[0.2] p-2 items-start space-x-2 bg-white dark:bg-black"
      >
        <img
          src="/avatar.png"
          alt="User"
          className="h-6 w-6 rounded-full shrink-0 mt-0.5"
        />
        <p className="text-xs text-neutral-600 dark:text-neutral-400">
          What's the best time to swap USDC to SOL?
        </p>
      </motion.div>
    </motion.div>
  );
};
const SkeletonTwo = () => {
  const variants = {
    initial: {
      opacity: 0,
      y: 10,
    },
    animate: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.3,
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    initial: { opacity: 0, x: -10 },
    animate: { opacity: 1, x: 0 },
  };

  return (
    <motion.div
      initial="initial"
      animate="animate"
      variants={variants}
      className="flex flex-1 w-full h-full min-h-[6rem] dark:bg-dot-white/[0.2] bg-muted/50 flex-col rounded-lg p-3 pt-1"
    >
      {/* Table Header */}
      <motion.div
        variants={itemVariants}
        className="flex justify-between items-center pb-2 border-b border-neutral-200 dark:border-neutral-700 mb-2"
      >
        <span className="text-xs font-medium text-neutral-600 dark:text-neutral-300">
          Asset
        </span>
        <span className="text-xs font-medium text-neutral-600 dark:text-neutral-300">
          Balance
        </span>
        <span className="text-xs font-medium text-neutral-600 dark:text-neutral-300">
          Value
        </span>
      </motion.div>

      {/* Table Rows */}
      <div className="flex flex-col space-y-1">
        <motion.div
          variants={itemVariants}
          className="flex justify-between items-center py-1"
        >
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full"></div>
            <span className="text-xs text-neutral-700 dark:text-neutral-300">
              SOL
            </span>
          </div>
          <span className="text-xs text-neutral-600 dark:text-neutral-400">
            12.45
          </span>
          <span className="text-xs font-medium text-green-600">$1,867</span>
        </motion.div>

        <motion.div
          variants={itemVariants}
          className="flex justify-between items-center py-1"
        >
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-gradient-to-r from-green-500 to-teal-500 rounded-full"></div>
            <span className="text-xs text-neutral-700 dark:text-neutral-300">
              USDC
            </span>
          </div>
          <span className="text-xs text-neutral-600 dark:text-neutral-400">
            2,450
          </span>
          <span className="text-xs font-medium text-green-600">$2,450</span>
        </motion.div>

        <motion.div
          variants={itemVariants}
          className="flex justify-between items-center py-1"
        >
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-gradient-to-r from-orange-500 to-red-500 rounded-full"></div>
            <span className="text-xs text-neutral-700 dark:text-neutral-300">
              RAY
            </span>
          </div>
          <span className="text-xs text-neutral-600 dark:text-neutral-400">
            1,250
          </span>
          <span className="text-xs font-medium text-green-600">$312</span>
        </motion.div>
      </div>

      {/* Total */}
      <motion.div
        variants={itemVariants}
        className="flex justify-between items-center pt-2 mt-2 border-t border-neutral-200 dark:border-neutral-700"
      >
        <span className="text-xs font-medium text-neutral-700 dark:text-neutral-300">
          Total
        </span>
        <span className="text-xs font-bold text-neutral-800 dark:text-neutral-200">
          $4,629
        </span>
      </motion.div>
    </motion.div>
  );
};
const SkeletonThree = () => {
  const variants = {
    initial: {
      backgroundPosition: "0 50%",
    },
    animate: {
      backgroundPosition: ["0, 50%", "100% 50%", "0 50%"],
    },
  };
  return (
    <motion.div
      initial="initial"
      animate="animate"
      variants={variants}
      transition={{
        duration: 5,
        repeat: Infinity,
        repeatType: "reverse",
      }}
      className="flex flex-1 w-full h-full min-h-[6rem] dark:bg-dot-white/[0.2] rounded-lg bg-dot-black/[0.2] flex-col space-y-2"
      style={{
        background:
          "linear-gradient(-45deg, #ee7752, #e73c7e, #23a6d5, #23d5ab)",
        backgroundSize: "400% 400%",
      }}
    >
      <motion.div className="h-full w-full rounded-lg"></motion.div>
    </motion.div>
  );
};
const SkeletonFour = () => {
  const first = {
    initial: {
      x: 20,
      rotate: -5,
    },
    hover: {
      x: 0,
      rotate: 0,
    },
  };
  const second = {
    initial: {
      x: -20,
      rotate: 5,
    },
    hover: {
      x: 0,
      rotate: 0,
    },
  };
  return (
    <motion.div
      initial="initial"
      animate="animate"
      whileHover="hover"
      className="flex flex-1 w-full h-full min-h-[6rem] dark:bg-dot-white/[0.2] bg-dot-black/[0.2] flex-row space-x-2"
    >
      <motion.div
        variants={first}
        className="h-full w-1/3 rounded-2xl bg-white p-4 dark:bg-black dark:border-white/[0.1] border border-neutral-200 flex flex-col items-center justify-center"
      >
        {/* <img
          src="https://pbs.twimg.com/profile_images/1417752099488636931/cs2R59eW_400x400.jpg"
          alt="avatar"
          height="100"
          width="100"
          className="rounded-full h-10 w-10"
        /> */}
        <p className="sm:text-sm text-xs text-center font-semibold text-neutral-500 mt-4">
          Get live Solana and SPL token prices updated in real time.
        </p>
        <p className="border border-blue-500 bg-blue-100 dark:bg-blue-900/20 text-blue-600 text-xs rounded-full px-2 py-0.5 mt-4">
          Token Prices
        </p>
      </motion.div>
      <motion.div className="h-full relative z-20 w-1/3 rounded-2xl bg-white p-4 dark:bg-black dark:border-white/[0.1] border border-neutral-200 flex flex-col items-center justify-center">
        {/* <img
          src="https://pbs.twimg.com/profile_images/1417752099488636931/cs2R59eW_400x400.jpg"
          alt="avatar"
          height="100"
          width="100"
          className="rounded-full h-10 w-10"
        /> */}
        <p className="sm:text-sm text-xs text-center font-semibold text-neutral-500 mt-4">
          Discover rising tokens, trending collections, and volume shifts.
        </p>
        <p className="border border-green-500 bg-green-100 dark:bg-green-900/20 text-green-600 text-xs rounded-full px-2 py-0.5 mt-4">
          Market Trends
        </p>
      </motion.div>
      <motion.div
        variants={second}
        className="h-full w-1/3 rounded-2xl bg-white p-4 dark:bg-black dark:border-white/[0.1] border border-neutral-200 flex flex-col items-center justify-center"
      >
        {/* <img
          src="https://pbs.twimg.com/profile_images/1417752099488636931/cs2R59eW_400x400.jpg"
          alt="avatar"
          height="100"
          width="100"
          className="rounded-full h-10 w-10"
        /> */}
        <p className="sm:text-sm text-xs text-center font-semibold text-neutral-500 mt-4">
          Get insights into market trends, price movements, and trading volumes.
        </p>
        <p className="border border-red-500 bg-red-100 dark:bg-red-900/20 text-red-600 text-xs rounded-full px-2 py-0.5 mt-4">
          Market Data
        </p>
      </motion.div>
    </motion.div>
  );
};
const SkeletonFive = () => {
  const variants = {
    initial: {
      x: 0,
    },
    animate: {
      x: 10,
      rotate: 5,
      transition: {
        duration: 0.2,
      },
    },
  };
  const variantsSecond = {
    initial: {
      x: 0,
    },
    animate: {
      x: -10,
      rotate: -5,
      transition: {
        duration: 0.2,
      },
    },
  };

  return (
    <motion.div
      initial="initial"
      whileHover="animate"
      className="flex flex-1 w-full h-full min-h-[6rem] dark:bg-dot-white/[0.2] bg-dot-black/[0.2] flex-col space-y-2"
    >
      <motion.div
        variants={variants}
        className="flex flex-row rounded-2xl border border-neutral-100 dark:border-white/[0.2] p-2  items-start space-x-2 bg-white dark:bg-black"
      >
        <img
          src="/avatar.png"
          alt="User"
          className="rounded-full h-6 w-6 shrink-0 mt-0.5"
        />
        <p className="text-xs text-neutral-500">
          Can you generate a Solana Pay QR code for someone to send me 0.5 SOL?
        </p>
      </motion.div>
      <motion.div
        variants={variantsSecond}
        className="flex flex-row rounded-2xl border border-neutral-100 dark:border-white/[0.2] p-3 items-center justify-end space-x-3 w-4/5 ml-auto bg-white dark:bg-black"
      >
        <div className="flex items-center space-x-3">
          <div className="bg-white p-2 rounded-lg border">
            <QRCode
              value="solana:EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v?amount=0.5&label=SOLMate%20Payment"
              size={64}
              level="L"
              fgColor="#000000"
              bgColor="#ffffff"
            />
          </div>
          <div className="flex flex-col">
            <p className="text-xs text-neutral-500 font-medium">
              Here's your payment QR code!
            </p>
            <p className="text-[10px] text-neutral-400">
              0.5 SOL payment request
            </p>
          </div>
        </div>
        <img src="/icon.svg" alt="AI Assistant" className="size-6 shrink-0" />
      </motion.div>
    </motion.div>
  );
};
const items = [
  {
    title: "AI Assistant",
    description: (
      <span className="text-sm">
        Ask about your portfolio, NFTs, or trading history—and get answers in
        seconds.
      </span>
    ),
    header: <SkeletonOne />,
    className: "md:col-span-1",
    icon: <IconClipboardCopy className="h-4 w-4 text-neutral-500" />,
  },
  {
    title: "Wallet Analytics",
    description: (
      <span className="text-sm">
        View real-time balances, USD values, and diversification metrics to
        understand your portfolio at a glance.
      </span>
    ),
    header: <SkeletonTwo />,
    className: "md:col-span-1",
    icon: <IconFileBroken className="h-4 w-4 text-neutral-500" />,
  },
  {
    title: "Instant Transactions",
    description: (
      <span className="text-sm">
        Swap tokens or send assets instantly with simple natural language
        commands.
      </span>
    ),
    header: <SkeletonThree />,
    className: "md:col-span-1",
    icon: <IconSignature className="h-4 w-4 text-neutral-500" />,
  },
  {
    title: "Market Data",
    description: (
      <span className="text-sm">
        Get real-time market insights, price trends, and trading volumes for
        your favorite tokens.
      </span>
    ),
    header: <SkeletonFour />,
    className: "md:col-span-2",
    icon: <IconTableColumn className="h-4 w-4 text-neutral-500" />,
  },

  {
    title: "Solana Pay",
    description: (
      <span className="text-sm">
        Make seamless payments and transactions on the Solana blockchain with
        ease.
      </span>
    ),
    header: <SkeletonFive />,
    className: "md:col-span-1",
    icon: <IconBoxAlignRightFilled className="h-4 w-4 text-neutral-500" />,
  },
];
