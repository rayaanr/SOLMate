"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { PublicKey, Keypair } from "@solana/web3.js";
import {
  QrCode,
  Copy,
  Wallet,
  XCircle,
  Loader2,
  ExternalLink,
  RefreshCw,
  CheckCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { encodeURL, findReference, FindReferenceError } from "@solana/pay";
import BigNumber from "bignumber.js";
import QRCode from "qrcode";
import { useSolanaConnection } from "@/providers/SolanaRPCProvider";

interface SimplePaymentCardProps {
  recipient: string;
  amount: number;
  tokenSymbol?: string;
  splToken?: string;
  label?: string;
  message?: string;
  onPaymentComplete?: (signature: string) => void;
}

export function SimplePaymentCard({
  recipient,
  amount,
  tokenSymbol,
  splToken,
  label,
  message,
  onPaymentComplete,
}: SimplePaymentCardProps) {
  const connection = useSolanaConnection(); // Use global connection
  const [paymentUrl, setPaymentUrl] = useState<string>("");
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const [copySuccess, setCopySuccess] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<
    "pending" | "confirmed" | "failed"
  >("pending");
  const monitoringRef = useRef<boolean>(false);
  const monitoringTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Helper function to stop monitoring and clean up
  const stopMonitoring = useCallback(() => {
    monitoringRef.current = false;
    if (monitoringTimeoutRef.current) {
      clearTimeout(monitoringTimeoutRef.current);
      monitoringTimeoutRef.current = null;
    }
  }, []);

  // Monitor payment confirmation
  const startPaymentMonitoring = useCallback(
    async (reference: PublicKey) => {
      if (monitoringRef.current) return; // Already monitoring

      monitoringRef.current = true;
      setPaymentStatus("pending");

      try {
        // Poll for payment confirmation
        const maxAttempts = 60; // Poll for up to 10 minutes (every 10 seconds)
        let attempts = 0;

        const pollForPayment = async (): Promise<void> => {
          // Check cancellation flag before proceeding
          if (!monitoringRef.current) {
            return;
          }

          if (attempts >= maxAttempts) {
            stopMonitoring();
            setPaymentStatus("failed");
            return;
          }

          try {
            // Use findReference to check if payment is confirmed
            const signature = await findReference(connection, reference, {
              finality: "confirmed",
            });

            // Payment found and confirmed!
            setPaymentStatus("confirmed");
            onPaymentComplete?.(signature.signature);
            stopMonitoring();
            return;
          } catch (error) {
            // Check cancellation flag before handling error
            if (!monitoringRef.current) {
              return;
            }

            if (error instanceof FindReferenceError) {
              // Payment not found yet, continue polling
              attempts++;
              // Check cancellation flag before scheduling next poll
              if (monitoringRef.current) {
                monitoringTimeoutRef.current = setTimeout(
                  pollForPayment,
                  10000
                );
              }
            } else {
              // Real error occurred, stop monitoring and log it
              console.error("Payment monitoring error:", error);
              stopMonitoring();
              setPaymentStatus("failed");
              return;
            }
          }
        };

        // Start polling after a short delay
        if (monitoringRef.current) {
          monitoringTimeoutRef.current = setTimeout(pollForPayment, 5000);
        }
      } catch (error) {
        console.error("Failed to start payment monitoring:", error);
        stopMonitoring();
        setPaymentStatus("failed");
      }
    },
    [onPaymentComplete, connection, stopMonitoring]
  );

  // Generate payment URL and QR code
  const generatePayment = useCallback(async () => {
    try {
      setIsLoading(true);
      setError("");

      // Stop any existing monitoring
      stopMonitoring();
      setPaymentStatus("pending");

      // Create payment URL with a unique reference
      const recipientPubkey = new PublicKey(recipient);
      const newReference = Keypair.generate().publicKey; // Generate unique reference each time

      const url = encodeURL({
        recipient: recipientPubkey,
        amount: new BigNumber(amount),
        splToken: splToken ? new PublicKey(splToken) : undefined,
        reference: newReference,
        label: label || `Payment: ${amount} ${tokenSymbol || "SOL"}`,
        message: message || `Pay ${amount} ${tokenSymbol || "SOL"}`,
      });

      setPaymentUrl(url.toString());

      // Generate QR code using a simpler approach
      try {
        // Use a QR code generation API or library
        const dataUrl = await QRCode.toDataURL(url.toString(), {
          width: 256,
          margin: 1,
        });
        setQrCodeDataUrl(dataUrl);
      } catch (qrError) {
        console.warn(
          "QR code generation failed, will show URL instead:",
          qrError
        );
        setQrCodeDataUrl("");
      }

      // Start monitoring for payment confirmation
      if (onPaymentComplete) {
        startPaymentMonitoring(newReference);
      }
    } catch (err) {
      console.error("Failed to generate payment:", err);
      setError(
        err instanceof Error ? err.message : "Failed to generate payment"
      );
    } finally {
      setIsLoading(false);
    }
  }, [
    recipient,
    amount,
    tokenSymbol,
    splToken,
    label,
    message,
    onPaymentComplete,
    startPaymentMonitoring,
    stopMonitoring,
  ]);

  // Cleanup monitoring when component unmounts
  useEffect(() => {
    return () => {
      stopMonitoring();
    };
  }, [stopMonitoring]);

  useEffect(() => {
    generatePayment();
  }, [generatePayment]);

  // Copy to clipboard
  const copyToClipboard = useCallback(async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (error) {
      console.error("Failed to copy:", error);
    }
  }, []);

  // Handle Phantom wallet integration
  const handlePhantomPayment = useCallback(async () => {
    try {
      // Try to open in Phantom
      const phantomUrl = `https://phantom.app/ul/browse/${encodeURIComponent(
        paymentUrl
      )}?ref=https://solmate.app`;
      window.open(phantomUrl, "_blank", "noopener,noreferrer");
    } catch (error) {
      console.error("Failed to open in Phantom:", error);
      // Fallback to regular URL
      window.open(paymentUrl, "_blank");
    }
  }, [paymentUrl]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        <span className="ml-2 text-gray-600 dark:text-gray-400">
          Creating payment request...
        </span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center p-8">
        <XCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          Failed to Create Payment Request
        </h3>
        <p className="text-gray-600 dark:text-gray-400">{error}</p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 space-y-6">
      {/* Header */}
      <div className="text-center">
        <div className="flex items-center justify-center gap-2 mb-2">
          <QrCode className="w-6 h-6 text-blue-600 dark:text-blue-400" />
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
            Solana Pay Request
          </h3>
        </div>
        <p className="text-gray-600 dark:text-gray-400">
          Scan with any Solana wallet or use the links below
        </p>
      </div>

      {/* Payment Details */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg p-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-gray-600 dark:text-gray-400">Amount</p>
            <p className="font-semibold text-gray-900 dark:text-white text-lg">
              {amount} {tokenSymbol || "SOL"}
            </p>
          </div>
          <div>
            <p className="text-gray-600 dark:text-gray-400">Recipient</p>
            <p className="font-mono text-xs text-gray-900 dark:text-white break-all">
              {recipient.slice(0, 8)}...{recipient.slice(-8)}
            </p>
          </div>
        </div>

        {/* Payment Status */}
        {onPaymentComplete && (
          <div className="mt-4 pt-4 border-t border-blue-100 dark:border-blue-800">
            <div className="flex items-center gap-2">
              {paymentStatus === "pending" && (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                  <span className="text-sm text-blue-600 dark:text-blue-400">
                    Waiting for payment...
                  </span>
                </>
              )}
              {paymentStatus === "confirmed" && (
                <>
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span className="text-sm text-green-600 dark:text-green-400">
                    Payment confirmed!
                  </span>
                </>
              )}
              {paymentStatus === "failed" && (
                <>
                  <XCircle className="w-4 h-4 text-red-600" />
                  <span className="text-sm text-red-600 dark:text-red-400">
                    Payment monitoring timeout
                  </span>
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {/* QR Code or URL */}
      <div className="flex justify-center">
        {qrCodeDataUrl ? (
          <div className="bg-white p-4 rounded-lg border-2 border-gray-200">
            <img
              src={qrCodeDataUrl}
              alt="Solana Pay QR Code"
              className="w-64 h-64"
              onError={() => setQrCodeDataUrl("")}
            />
          </div>
        ) : (
          <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg border-2 border-gray-200 dark:border-gray-600 max-w-sm">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
              Payment URL:
            </p>
            <p className="text-xs font-mono text-gray-900 dark:text-white break-all bg-white dark:bg-gray-800 p-2 rounded">
              {paymentUrl}
            </p>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex flex-col gap-3">
        {/* Copy URL */}
        <Button
          onClick={() => copyToClipboard(paymentUrl)}
          variant="outline"
          className="w-full"
        >
          <Copy className="w-4 h-4 mr-2" />
          {copySuccess ? "Copied!" : "Copy Payment URL"}
        </Button>

        {/* Wallet buttons */}
        <div className="grid grid-cols-2 gap-2">
          <Button
            onClick={handlePhantomPayment}
            variant="outline"
            size="sm"
            className="bg-purple-50 hover:bg-purple-100 border-purple-200 text-purple-700"
          >
            <Wallet className="w-4 h-4 mr-1" />
            Phantom
          </Button>

          <Button
            onClick={() => {
              const solflareUrl = `https://solflare.com/ul/browse/${encodeURIComponent(
                paymentUrl
              )}`;
              window.open(solflareUrl, "_blank", "noopener,noreferrer");
            }}
            variant="outline"
            size="sm"
            className="bg-green-50 hover:bg-green-100 border-green-200 text-green-700"
          >
            <Wallet className="w-4 h-4 mr-1" />
            Solflare
          </Button>
        </div>

        {/* Other actions */}
        <div className="grid grid-cols-2 gap-2">
          <Button
            onClick={() =>
              window.open(paymentUrl, "_blank", "noopener,noreferrer")
            }
            variant="outline"
            size="sm"
          >
            <ExternalLink className="w-4 h-4 mr-1" />
            Open URL
          </Button>

          <Button
            onClick={generatePayment}
            variant="outline"
            size="sm"
            disabled={isLoading}
          >
            <RefreshCw className="w-4 h-4 mr-1" />
            {isLoading ? "Generating..." : "Refresh"}
          </Button>
        </div>

        {/* Info */}
        <div className="text-center text-xs text-gray-500 dark:text-gray-400 space-y-1">
          <p>
            💡 Install a Solana wallet extension (Phantom, Solflare) for direct
            payments
          </p>
          <p>📱 Or scan the QR code with your mobile wallet</p>
        </div>
      </div>
    </div>
  );
}
