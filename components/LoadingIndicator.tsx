import { Loader2 } from "lucide-react";

type ColorToken = 
  | "primary"
  | "secondary" 
  | "blue"
  | "green"
  | "red"
  | "yellow"
  | "purple"
  | "indigo"
  | "gray"
  | "slate"
  | "white"
  | "black";

interface LoadingIndicatorProps {
  className?: string;
  color?: ColorToken;
}

// Static color class mapping to ensure Tailwind picks them up
const colorClassMap: Record<ColorToken, string> = {
  primary: "text-blue-600",
  secondary: "text-gray-500", 
  blue: "text-blue-500",
  green: "text-green-500",
  red: "text-red-500",
  yellow: "text-yellow-500",
  purple: "text-purple-500",
  indigo: "text-indigo-500",
  gray: "text-gray-500",
  slate: "text-slate-500",
  white: "text-white",
  black: "text-black",
};

export function LoadingIndicator({ className = "w-4 h-4", color }: LoadingIndicatorProps) {
  const colorClass = color ? colorClassMap[color] : "text-current";
  return (
    <Loader2 className={`animate-spin ${className} ${colorClass}`} />
  );
}
