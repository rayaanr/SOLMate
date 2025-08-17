import React from "react";

export interface NFTCardProps {
  name: string;
  imageUrl: string | null;
  collection?: { name?: string | null };
  compressed?: boolean;
  mint?: string;
}

export function NFTCard({ name, imageUrl, collection, compressed, mint }: NFTCardProps) {
  return (
    <div className="rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 hover:shadow-lg transition-shadow duration-200">
      <div className="aspect-square bg-gray-100 dark:bg-gray-800 relative">
        {imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img 
            src={imageUrl} 
            alt={name} 
            className="w-full h-full object-cover" 
            loading="lazy"
            onError={(e) => {
              // Hide broken images gracefully
              e.currentTarget.style.display = 'none';
              const fallback = e.currentTarget.nextElementSibling as HTMLElement;
              if (fallback) fallback.style.display = 'flex';
            }}
          />
        ) : null}
        <div 
          className="w-full h-full flex items-center justify-center text-gray-400 dark:text-gray-500 text-sm"
          style={{ display: imageUrl ? 'none' : 'flex' }}
        >
          No Image
        </div>
        {compressed && (
          <div className="absolute top-2 right-2">
            <span className="text-[10px] px-2 py-1 rounded-full bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300 font-medium">
              cNFT
            </span>
          </div>
        )}
      </div>
      <div className="p-3">
        <div className="flex items-start justify-between mb-1">
          <p className="font-medium text-sm text-gray-900 dark:text-gray-100 truncate pr-2" title={name}>
            {name}
          </p>
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400 truncate" title={collection?.name || "Uncategorized"}>
          {collection?.name || "Uncategorized"}
        </p>
        {mint && (
          <p className="mt-1 text-[10px] text-gray-400 dark:text-gray-500 truncate font-mono" title={mint}>
            {mint}
          </p>
        )}
      </div>
    </div>
  );
}
