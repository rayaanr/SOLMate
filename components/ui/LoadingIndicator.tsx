import { Loader2 } from "lucide-react";

interface LoadingIndicatorProps {
  className?: string;
  color?: string;
}

export function LoadingIndicator({ className = "w-4 h-4", color }: LoadingIndicatorProps) {
  const colorClass = color ? `text-${color.replace('bg-', '')}` : '';
  return (
    <Loader2 className={`animate-spin ${className} ${colorClass}`} />
  );
}
