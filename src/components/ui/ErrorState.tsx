// src/components/ui/ErrorState.tsx

import { AlertTriangle, RefreshCw } from "lucide-react";

export default function ErrorState({
  message = "Something went wrong.",
  onRetry,
}: {
  message?: string;
  onRetry?: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-24 gap-4">
      <div className="w-12 h-12 rounded-full bg-red-50 dark:bg-red-900/20 flex items-center justify-center">
        <AlertTriangle size={22} className="text-red-500 dark:text-red-400" />
      </div>
      <div className="text-center">
        <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{message}</p>
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
          Please check your connection and try again.
        </p>
      </div>
      {onRetry && (
        <button
          onClick={onRetry}
          className="flex items-center gap-2 text-xs font-medium text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800 rounded-lg px-3 py-2 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
        >
          <RefreshCw size={13} />
          Try again
        </button>
      )}
    </div>
  );
}