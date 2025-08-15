import { LoadingIndicator } from "../LoadingIndicator";

export function ChatLoadingIndicator() {
  return (
    <div className="flex justify-start">
      <div className="max-w-3xl px-4 py-3 rounded-2xl bg-gray-100 dark:bg-gray-800">
        <div className="flex items-center space-x-2">
          <LoadingIndicator />
          <span className="text-sm text-gray-500">SOLMate is thinking...</span>
        </div>
      </div>
    </div>
  );
}
