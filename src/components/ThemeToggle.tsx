// src/components/ThemeToggle.tsx

"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Sun, Moon, Monitor } from "lucide-react";

export default function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Avoid hydration mismatch
  useEffect(() => setMounted(true), []);
  if (!mounted) return (
    <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-800 animate-pulse" />
  );

  const options = [
    { value: "light",  icon: Sun,     label: "Light"  },
    { value: "dark",   icon: Moon,    label: "Dark"   },
    { value: "system", icon: Monitor, label: "System" },
  ];

  return (
    <div className="flex items-center gap-0.5 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
      {options.map(({ value, icon: Icon, label }) => (
        <button
          key={value}
          onClick={() => setTheme(value)}
          title={label}
          className={`p-1.5 rounded-md transition-colors ${
            theme === value
              ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm"
              : "text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          }`}
        >
          <Icon size={14} />
        </button>
      ))}
    </div>
  );
}