import { LoadingIndicator } from "../LoadingIndicator";

interface TransactionPreparingCardProps {
  type: "transaction" | "swap";
}

export function TransactionPreparingCard({
  type,
}: TransactionPreparingCardProps) {
  const isTransaction = type === "transaction";

  const colorClasses = isTransaction
    ? "from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-blue-200 dark:border-blue-700"
    : "from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 border-purple-200 dark:border-purple-700";

  const textColorClasses = isTransaction
    ? "text-blue-700 dark:text-blue-300"
    : "text-purple-700 dark:text-purple-300";

  const loadingColor = isTransaction ? "blue" : "purple";

  const title = isTransaction
    ? "Preparing transaction..."
    : "Preparing swap...";

  return (
    <div className="mt-4">
      <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
        <div
          className={`bg-gradient-to-r ${colorClasses} border rounded-xl p-5 space-y-4`}
        >
          <div className="flex items-center space-x-3">
            <LoadingIndicator color={loadingColor} />
            <span className={`text-sm font-medium ${textColorClasses}`}>
              🔄 {title}
            </span>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-100 dark:border-gray-700">
            <div className="animate-pulse space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-20"></div>
                  <div className="h-6 bg-gray-300 dark:bg-gray-500 rounded w-32"></div>
                </div>
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-24"></div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-28"></div>
                </div>
              </div>
              <div className="pt-2 border-t border-gray-100 dark:border-gray-700">
                <div
                  className={`h-3 bg-gray-200 dark:bg-gray-600 rounded ${
                    isTransaction ? "w-3/4" : "w-2/3"
                  }`}
                ></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
