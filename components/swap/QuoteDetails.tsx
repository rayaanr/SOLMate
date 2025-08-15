interface QuoteDetailsProps {
  quoteResponse: any;
  isLoading: boolean;
  getPriceImpact: () => string;
  lastRefreshTimestamp: number | null;
}

export function QuoteDetails({
  quoteResponse,
  isLoading,
  getPriceImpact,
  lastRefreshTimestamp,
}: QuoteDetailsProps) {
  if (!quoteResponse || isLoading) {
    return null;
  }

  return (
    <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <span className="text-gray-500 dark:text-gray-400">
            Price Impact:
          </span>
          <span className="ml-2 font-medium text-gray-900 dark:text-white">
            {getPriceImpact()}
          </span>
        </div>
        <div>
          <span className="text-gray-500 dark:text-gray-400">
            Slippage:
          </span>
          <span className="ml-2 font-medium text-gray-900 dark:text-white">
            1%
          </span>
        </div>
      </div>
      {lastRefreshTimestamp && (
        <div className="mt-2 text-xs text-gray-400">
          Last updated:{" "}
          {new Date(lastRefreshTimestamp).toLocaleTimeString()}
        </div>
      )}
    </div>
  );
}
