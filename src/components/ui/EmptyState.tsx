// src/components/ui/EmptyState.tsx

import { LucideIcon } from "lucide-react";

export default function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-24 px-6 text-center bg-white dark:bg-slate-800 border border-dashed border-gray-200 dark:border-slate-700 rounded-2xl">
      <div className="w-14 h-14 rounded-full bg-gray-50 dark:bg-slate-700 flex items-center justify-center mb-4 ring-8 ring-gray-50/50 dark:ring-slate-700/30">
        <Icon size={26} className="text-gray-400 dark:text-gray-500" strokeWidth={1.5} />
      </div>
      <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-1">
        {title}
      </h3>
      <p className="text-sm text-gray-500 dark:text-gray-400 max-w-xs mb-6">
        {description}
      </p>
      {action}
    </div>
  );
}