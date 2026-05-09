// src/components/ui/LoadingState.tsx

export default function LoadingState({ message = "Loading..." }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 gap-3">
      <div className="w-8 h-8 border-4 border-blue-200 dark:border-blue-900 border-t-blue-600 rounded-full animate-spin" />
      <p className="text-sm text-gray-400 dark:text-gray-500 font-medium">{message}</p>
    </div>
  );
}