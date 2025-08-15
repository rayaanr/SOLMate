import { AlertCircle, CheckCircle2 } from "lucide-react";

interface SwapStatusMessageProps {
  localError?: string | null;
  error?: { message?: string } | null;
  status: "idle" | "success" | "error";
  hash?: string | null;
}

export function SwapStatusMessage({ localError, error, status, hash }: SwapStatusMessageProps) {
  if (localError || error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
        <div className="flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 text-red-500" />
          <p className="text-sm text-red-700 dark:text-red-300">
            {localError || error?.message}
          </p>
        </div>
      </div>
    );
  }

  if (status === "success" && hash) {
    return (
      <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3">
        <div className="flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 text-green-500" />
          <p className="text-sm text-green-700 dark:text-green-300">
            Swap completed successfully!
          </p>
        </div>
        <p className="text-xs text-green-600 dark:text-green-400 mt-1 font-mono break-all">
          {hash}
        </p>
      </div>
    );
  }

  return null;
}
