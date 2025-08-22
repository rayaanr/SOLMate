"use client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { ChevronDown } from "lucide-react";
import Image from "next/image";
import { useState } from "react";

const AVAILABLE_CHAINS = [
  { id: "solana", name: "Solana", icon: "/sol.png", enabled: true },
  { id: "ethereum", name: "Ethereum", icon: "/eth.png", enabled: false },
  { id: "polygon", name: "Polygon", icon: "/polygon.png", enabled: false },
  { id: "arbitrum", name: "Arbitrum", icon: "/atb.png", enabled: false },
  { id: "optimism", name: "Optimism", icon: "/optimism.png", enabled: false },
];

type ChainSelectorProps = {
  selectedChainId: string;
  setSelectedChainId: (chainId: string) => void;
  className?: string;
};

export function ChainSelector({
  selectedChainId,
  setSelectedChainId,
  className,
}: ChainSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);

  const currentChain = AVAILABLE_CHAINS.find(
    (chain) => chain.id === selectedChainId
  );

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          className={cn("justify-between", className)}
          size="sm"
        >
          <div className="flex items-center gap-2">
            {currentChain?.icon && (
              <Image
                src={currentChain.icon}
                alt={currentChain.name}
                width={16}
                height={16}
              />
            )}
            <span>{currentChain?.name || "Select chain"}</span>
          </div>
          <ChevronDown className="size-4 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-[200px]" align="start">
        {AVAILABLE_CHAINS.map((chain) => (
          <DropdownMenuItem
            key={chain.id}
            className={cn(
              "flex items-center gap-3 cursor-pointer",
              selectedChainId === chain.id && "bg-accent",
              !chain.enabled && "opacity-50 cursor-not-allowed"
            )}
            onSelect={() => {
              if (chain.enabled) {
                setSelectedChainId(chain.id);
                setIsOpen(false);
              }
            }}
            disabled={!chain.enabled}
          >
            <Image src={chain.icon} alt={chain.name} width={16} height={16} />
            <span>{chain.name}</span>
            {!chain.enabled && (
              <span className="ml-auto text-xs text-muted-foreground">
                Soon
              </span>
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
