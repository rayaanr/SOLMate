"use client";

import React from "react";

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<{ error?: Error; resetError?: () => void }>;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log the error for debugging
    console.error("Table ErrorBoundary caught an error:", error, errorInfo);
    
    // Call optional error handler
    this.props.onError?.(error, errorInfo);
  }

  resetError = () => {
    this.setState({ hasError: false, error: undefined });
  };

  render() {
    if (this.state.hasError) {
      // Render fallback UI if provided, otherwise default fallback
      if (this.props.fallback) {
        const Fallback = this.props.fallback;
        return <Fallback error={this.state.error} resetError={this.resetError} />;
      }

      return (
        <div className="p-4 text-sm text-red-600 border border-red-300 rounded-lg bg-red-50">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-medium">Something went wrong rendering this table</h3>
            <button
              onClick={this.resetError}
              className="text-xs bg-red-100 hover:bg-red-200 px-2 py-1 rounded"
            >
              Try again
            </button>
          </div>
          <p className="text-xs text-red-500">
            {this.state.error?.message || "An unknown error occurred"}
          </p>
        </div>
      );
    }

    return this.props.children;
  }
}

// Hook version for functional components
export function useErrorBoundary() {
  const [error, setError] = React.useState<Error | null>(null);

  const resetError = React.useCallback(() => {
    setError(null);
  }, []);

  const captureError = React.useCallback((error: Error) => {
    setError(error);
  }, []);

  React.useEffect(() => {
    if (error) {
      throw error;
    }
  }, [error]);

  return { captureError, resetError };
}

// Wrapper component for table isolation
interface TableWrapperProps {
  children: React.ReactNode;
  className?: string;
}

export const TableWrapper: React.FC<TableWrapperProps> = ({ children, className = "" }) => {
  return (
    <ErrorBoundary>
      <div 
        className={`table-wrapper ${className}`}
        style={{
          // Isolate the table from parent event handling
          isolation: 'isolate',
          contain: 'layout style',
          // Prevent event propagation issues
          position: 'relative',
        }}
        onClickCapture={(e) => {
          // Prevent table interactions from interfering with chat input
          e.stopPropagation();
        }}
      >
        {children}
      </div>
    </ErrorBoundary>
  );
};
