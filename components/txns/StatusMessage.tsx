import { AlertCircle, CheckCircle2 } from "lucide-react";

interface StatusMessageProps {
  localError?: string | null;
  error?: { message?: string } | null;
  status: "idle" | "success" | "error";
  hash?: string | null;
}

export function StatusMessage({ localError, error, status, hash }: StatusMessageProps) {
  if (localError || error) {
    return (
      <div className="flex items-center space-x-2 text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 p-3 rounded-lg border border-red-200 dark:border-red-800">
        <AlertCircle className="w-4 h-4 flex-shrink-0" />
        <span className="text-sm">{localError || error?.message}</span>
      </div>
    );
  }

  if (status === "success" || hash) {
    return (
      <div className="flex items-center space-x-2 text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 p-3 rounded-lg border border-green-200 dark:border-green-800">
        <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
        <div className="text-sm">
          <p>Transaction successful!</p>
          {hash && (
            <p className="font-mono text-xs opacity-75 mt-1">
              Signature: {hash.slice(0, 8)}...{hash.slice(-8)}
            </p>
          )}
        </div>
      </div>
    );
  }

  return null;
}
