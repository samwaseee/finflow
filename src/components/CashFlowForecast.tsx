// src/components/CashFlowForecast.tsx

"use client";

import { useEffect, useState } from "react";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Legend,
} from "recharts";
import { TrendingUp, AlertTriangle, Lightbulb, Sparkles, RefreshCw } from "lucide-react";

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
        bg: "bg-green-50",
        border: "border-green-200",
        icon_color: "text-green-600",
        text_color: "text-green-800",
    },
    warning: {
        icon: AlertTriangle,
        bg: "bg-yellow-50",
        border: "border-yellow-200",
        icon_color: "text-yellow-600",
        text_color: "text-yellow-800",
    },
    suggestion: {
        icon: Lightbulb,
        bg: "bg-blue-50",
        border: "border-blue-200",
        icon_color: "text-blue-600",
        text_color: "text-blue-800",
    },
};

function HealthScoreRing({ score }: { score: number }) {
    const radius = 40;
    const circumference = 2 * Math.PI * radius;
    const progress = ((100 - score) / 100) * circumference;

    const color =
        score >= 70 ? "#10B981" : score >= 40 ? "#F59E0B" : "#EF4444";

    return (
        <div className="flex flex-col items-center justify-center">
            <div className="relative w-24 h-24">
                <svg className="w-24 h-24 -rotate-90" viewBox="0 0 100 100">
                    <circle
                        cx="50"
                        cy="50"
                        r={radius}
                        fill="none"
                        stroke="#F3F4F6"
                        strokeWidth="10"
                    />
                    <circle
                        cx="50"
                        cy="50"
                        r={radius}
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
                    <span className="text-xl font-bold text-gray-900">{score}</span>
                </div>
            </div>
            <p className="text-xs text-gray-500 mt-1">Health score</p>
        </div>
    );
}

function ForecastTooltip({ active, payload, label }: any) {
    if (!active || !payload?.length) return null;
    return (
        <div className="bg-white border border-gray-200 rounded-xl shadow-lg p-3 text-sm">
            <p className="font-medium text-gray-700 mb-2">{label}</p>
            {payload.map((entry: any) => (
                <div key={entry.name} className="flex items-center gap-2">
                    <span
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: entry.fill }}
                    />
                    <span className="text-gray-500 capitalize">{entry.name}:</span>
                    <span className="font-medium text-gray-900">
                        ${Number(entry.value).toLocaleString()}
                    </span>
                </div>
            ))}
        </div>
    );
}

export default function CashFlowForecast() {
    const [data, setData] = useState<ApiResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [refreshing, setRefreshing] = useState(false);

    async function fetchForecast(refresh = false) {
        try {
            const url = refresh ? "/api/ai/forecast?refresh=true" : "/api/ai/forecast";
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

    useEffect(() => { fetchForecast(); }, []);

    async function handleRefresh() {
        setRefreshing(true);
        await fetchForecast(true);
    }

    if (loading) {
        return (
            <div className="bg-white border border-gray-200 rounded-xl p-8 shadow-sm mt-8">
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-8 h-8 bg-purple-100 rounded-lg animate-pulse" />
                    <div className="h-5 bg-gray-100 rounded w-48 animate-pulse" />
                </div>
                <div className="flex items-center justify-center py-12 text-sm text-gray-400">
                    <div className="flex flex-col items-center gap-3">
                        <Sparkles size={24} className="text-purple-400 animate-pulse" />
                        <p>AI is analyzing your financial data...</p>
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-white border border-gray-200 rounded-xl p-8 shadow-sm mt-8 text-center">
                <p className="text-sm text-gray-500">{error}</p>
            </div>
        );
    }

    if (!data) return null;

    const { forecast, monthlyData } = data;

    // Combine historical + forecast for chart
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

    return (
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm mt-8 overflow-hidden">
            {/* Header */}
            <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-100 rounded-lg">
                        <Sparkles size={16} className="text-purple-600" />
                    </div>
                    <div>
                        <h2 className="text-base font-semibold text-gray-900">
                            AI Cash Flow Forecast
                        </h2>
                        <p className="text-xs text-gray-400">
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
                    className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-700 border border-gray-200 rounded-lg px-3 py-1.5 transition-colors disabled:opacity-50"
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
                        <p className="text-sm text-gray-600 leading-relaxed">
                            {forecast.summary}
                        </p>
                    </div>
                </div>

                {/* Forecast chart */}
                <div>
                    <div className="flex items-center gap-2 mb-3">
                        <h3 className="text-sm font-medium text-gray-700">
                            Revenue vs Expenses
                        </h3>
                        <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">
                            last 3 months + 3 month forecast
                        </span>
                    </div>
                    <ResponsiveContainer width="100%" height={220}>
                        <BarChart data={chartData} barGap={4}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                            <XAxis
                                dataKey="month"
                                tick={{ fontSize: 11, fill: "#9CA3AF" }}
                                axisLine={false}
                                tickLine={false}
                            />
                            <YAxis
                                tick={{ fontSize: 11, fill: "#9CA3AF" }}
                                axisLine={false}
                                tickLine={false}
                                tickFormatter={(v) => `$${v.toLocaleString()}`}
                            />
                            <Tooltip content={<ForecastTooltip />} />
                            <Legend
                                wrapperStyle={{ fontSize: "12px", paddingTop: "12px" }}
                            />
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
                            className="bg-gray-50 rounded-xl p-4 border border-gray-100"
                        >
                            <p className="text-xs font-medium text-gray-500 mb-3">
                                {m.month}
                            </p>
                            <div className="space-y-1.5">
                                <div className="flex justify-between text-xs">
                                    <span className="text-gray-500">Revenue</span>
                                    <span className="font-medium text-blue-600">
                                        ${m.projectedRevenue.toLocaleString()}
                                    </span>
                                </div>
                                <div className="flex justify-between text-xs">
                                    <span className="text-gray-500">Expenses</span>
                                    <span className="font-medium text-red-500">
                                        ${m.projectedExpenses.toLocaleString()}
                                    </span>
                                </div>
                                <div className="flex justify-between text-xs pt-1.5 border-t border-gray-200">
                                    <span className="text-gray-600 font-medium">Profit</span>
                                    <span
                                        className={`font-semibold ${m.projectedProfit >= 0
                                                ? "text-green-600"
                                                : "text-red-600"
                                            }`}
                                    >
                                        ${m.projectedProfit.toLocaleString()}
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Insights */}
                <div>
                    <h3 className="text-sm font-medium text-gray-700 mb-3">
                        AI Insights
                    </h3>
                    <div className="space-y-2">
                        {forecast.insights.map((insight, i) => {
                            const style =
                                INSIGHT_STYLES[insight.type] ?? INSIGHT_STYLES.suggestion;
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