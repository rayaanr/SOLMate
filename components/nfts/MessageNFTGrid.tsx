import React from "react";
import { NFTCard } from "./NFTCard";

export interface MessageNFTGridProps {
  nfts: Array<{
    mint: string;
    name: string;
    image_url: string | null;
    collection?: { name?: string | null };
    compressed?: boolean;
  }>;
}

export function MessageNFTGrid({ nfts }: MessageNFTGridProps) {
  if (!nfts || nfts.length === 0) {
    return <div className="mt-4 text-sm text-gray-500 dark:text-gray-400">No NFTs found.</div>;
  }

  return (
    <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
      {nfts.map((n) => (
        <NFTCard
          key={n.mint}
          name={n.name}
          imageUrl={n.image_url}
          collection={n.collection}
          compressed={n.compressed}
          mint={n.mint}
        />
      ))}
    </div>
  );
}
