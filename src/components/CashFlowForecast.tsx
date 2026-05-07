// src/components/CashFlowForecast.tsx

"use client";

import { useEffect, useState } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import { TrendingUp, AlertTriangle, Lightbulb, Sparkles, RefreshCw } from "lucide-react";
import { useTheme } from "next-themes";

type ForecastMonth = {
  month: string;
  projectedRevenue: number;
  projectedExpenses: number;
  projectedProfit: number;
};

type Insight = {
  type: "positive" | "warning" | "suggestion";
  text: string;
};

type ForecastData = {
  summary: string;
  forecast: ForecastMonth[];
  insights: Insight[];
  healthScore: number;
};

type ApiResponse = {
  forecast: ForecastData;
  monthlyData: {
    month: string;
    revenue: number;
    expenses: number;
    profit: number;
  }[];
  cached: boolean;
  stale?: boolean;
  expiresAt: string;
};

const INSIGHT_STYLES = {
  positive: {
    icon: TrendingUp,
    bg: "bg-green-50 dark:bg-green-900/20",
    border: "border-green-200 dark:border-green-800/50",
    icon_color: "text-green-600 dark:text-green-400",
    text_color: "text-green-800 dark:text-green-300",
  },
  warning: {
    icon: AlertTriangle,
    bg: "bg-yellow-50 dark:bg-yellow-900/20",
    border: "border-yellow-200 dark:border-yellow-800/50",
    icon_color: "text-yellow-600 dark:text-yellow-400",
    text_color: "text-yellow-800 dark:text-yellow-300",
  },
  suggestion: {
    icon: Lightbulb,
    bg: "bg-blue-50 dark:bg-blue-900/20",
    border: "border-blue-200 dark:border-blue-800/50",
    icon_color: "text-blue-600 dark:text-blue-400",
    text_color: "text-blue-800 dark:text-blue-300",
  },
};

function HealthScoreRing({ score }: { score: number }) {
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const progress = ((100 - score) / 100) * circumference;
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const color = score >= 70 ? "#10B981" : score >= 40 ? "#F59E0B" : "#EF4444";

  return (
    <div className="flex flex-col items-center justify-center">
      <div className="relative w-24 h-24">
        <svg className="w-24 h-24 -rotate-90" viewBox="0 0 100 100">
          <circle
            cx="50" cy="50" r={radius}
            fill="none"
            stroke={isDark ? "#334155" : "#F3F4F6"}
            strokeWidth="10"
          />
          <circle
            cx="50" cy="50" r={radius}
            fill="none"
            stroke={color}
            strokeWidth="10"
            strokeDasharray={circumference}
            strokeDashoffset={progress}
            strokeLinecap="round"
            style={{ transition: "stroke-dashoffset 1s ease" }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-xl font-bold text-gray-900 dark:text-gray-100">{score}</span>
        </div>
      </div>
      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Health score</p>
    </div>
  );
}

function ForecastTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl shadow-lg p-3 text-sm">
      <p className="font-medium text-gray-700 dark:text-gray-300 mb-2">{label}</p>
      {payload.map((entry: any) => (
        <div key={entry.name} className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.fill }} />
          <span className="text-gray-500 dark:text-gray-400 capitalize">{entry.name}:</span>
          <span className="font-medium text-gray-900 dark:text-gray-100">
            ${Number(entry.value).toLocaleString()}
          </span>
        </div>
      ))}
    </div>
  );
}

export default function CashFlowForecast({ orgId }: { orgId: string }) {
  const [data, setData] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  async function fetchForecast(refresh = false) {
    setLoading(true);
    try {
      const url = refresh
        ? `/api/ai/forecast?orgId=${orgId}&refresh=true`
        : `/api/ai/forecast?orgId=${orgId}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch");
      const json = await res.json();
      setData(json);
      setError("");
    } catch {
      setError("Could not load forecast. Make sure you have financial data.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => { fetchForecast(); }, [orgId]);

  async function handleRefresh() {
    setRefreshing(true);
    await fetchForecast(true);
  }

  if (loading) {
    return (
      <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl p-8 shadow-sm mt-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900/30 rounded-lg animate-pulse" />
          <div className="h-5 bg-gray-100 dark:bg-slate-700 rounded w-48 animate-pulse" />
        </div>
        <div className="flex items-center justify-center py-12 text-sm text-gray-400 dark:text-gray-500">
          <div className="flex flex-col items-center gap-3">
            <Sparkles size={24} className="text-purple-400 dark:text-purple-500 animate-pulse" />
            <p>AI is analyzing your financial data...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl p-8 shadow-sm mt-8 text-center">
        <p className="text-sm text-gray-500 dark:text-gray-400">{error}</p>
      </div>
    );
  }

  if (!data) return null;

  const { forecast, monthlyData } = data;

  const chartData = [
    ...monthlyData.slice(-3).map((m) => ({
      month: m.month,
      Revenue: m.revenue,
      Expenses: m.expenses,
      type: "actual",
    })),
    ...forecast.forecast.map((m) => ({
      month: m.month,
      Revenue: m.projectedRevenue,
      Expenses: m.projectedExpenses,
      type: "forecast",
    })),
  ];

  const gridColor = isDark ? "#1e293b" : "#F3F4F6";
  const tickColor = isDark ? "#94a3b8" : "#9CA3AF";

  return (
    <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl shadow-sm mt-8 overflow-hidden">

      {/* Header */}
      <div className="px-6 py-5 border-b border-gray-100 dark:border-slate-700 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
            <Sparkles size={16} className="text-purple-600 dark:text-purple-400" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">
              AI Cash Flow Forecast
            </h2>
            <p className="text-xs text-gray-400 dark:text-gray-500">
              {data?.cached
                ? `Cached · refreshes ${new Date(data.expiresAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}`
                : "Based on your last 6 months · Next 3 months projected"}
              {data?.stale && " · using stale data"}
            </p>
          </div>
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 border border-gray-200 dark:border-slate-600 rounded-lg px-3 py-1.5 transition-colors disabled:opacity-50 hover:bg-gray-50 dark:hover:bg-slate-700"
          title="Force refresh (uses 1 AI call)"
        >
          <RefreshCw size={12} className={refreshing ? "animate-spin" : ""} />
          {refreshing ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      <div className="p-6 space-y-6">

        {/* Summary + Health Score */}
        <div className="flex items-start gap-6">
          <HealthScoreRing score={forecast.healthScore} />
          <div className="flex-1">
            <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
              {forecast.summary}
            </p>
          </div>
        </div>

        {/* Forecast chart */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Revenue vs Expenses
            </h3>
            <span className="text-xs bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 px-2 py-0.5 rounded-full">
              last 3 months + 3 month forecast
            </span>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={chartData} barGap={4}>
              <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
              <XAxis
                dataKey="month"
                tick={{ fontSize: 11, fill: tickColor }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 11, fill: tickColor }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => `$${v.toLocaleString()}`}
              />
              <Tooltip content={<ForecastTooltip />} />
              <Legend wrapperStyle={{ fontSize: "12px", paddingTop: "12px", color: tickColor }} />
              <Bar dataKey="Revenue" fill="#3B82F6" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Expenses" fill="#F87171" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Projected numbers */}
        <div className="grid grid-cols-3 gap-4">
          {forecast.forecast.map((m) => (
            <div
              key={m.month}
              className="bg-gray-50 dark:bg-slate-700/50 rounded-xl p-4 border border-gray-100 dark:border-slate-700"
            >
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-3">
                {m.month}
              </p>
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="text-gray-500 dark:text-gray-400">Revenue</span>
                  <span className="font-medium text-blue-600 dark:text-blue-400">
                    ${m.projectedRevenue.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-500 dark:text-gray-400">Expenses</span>
                  <span className="font-medium text-red-500 dark:text-red-400">
                    ${m.projectedExpenses.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between text-xs pt-1.5 border-t border-gray-200 dark:border-slate-600">
                  <span className="text-gray-600 dark:text-gray-300 font-medium">Profit</span>
                  <span className={`font-semibold ${
                    m.projectedProfit >= 0
                      ? "text-green-600 dark:text-green-400"
                      : "text-red-600 dark:text-red-400"
                  }`}>
                    ${m.projectedProfit.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Insights */}
        <div>
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            AI Insights
          </h3>
          <div className="space-y-2">
            {forecast.insights.map((insight, i) => {
              const style = INSIGHT_STYLES[insight.type] ?? INSIGHT_STYLES.suggestion;
              const Icon = style.icon;
              return (
                <div
                  key={i}
                  className={`flex items-start gap-3 p-3 rounded-lg border ${style.bg} ${style.border}`}
                >
                  <Icon size={15} className={`${style.icon_color} mt-0.5 shrink-0`} />
                  <p className={`text-xs leading-relaxed ${style.text_color}`}>
                    {insight.text}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
}