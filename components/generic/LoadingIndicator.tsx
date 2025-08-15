interface LoadingIndicatorProps {
  size?: "sm" | "md";
  color?: string;
}

export function LoadingIndicator({ 
  size = "md", 
  color = "bg-gray-400" 
}: LoadingIndicatorProps) {
  const dotSize = size === "sm" ? "w-1.5 h-1.5" : "w-2 h-2";
  
  return (
    <div className="flex space-x-1">
      <div className={`${dotSize} ${color} rounded-full animate-bounce`}></div>
      <div
        className={`${dotSize} ${color} rounded-full animate-bounce`}
        style={{ animationDelay: "0.1s" }}
      ></div>
      <div
        className={`${dotSize} ${color} rounded-full animate-bounce`}
        style={{ animationDelay: "0.2s" }}
      ></div>
    </div>
  );
}
