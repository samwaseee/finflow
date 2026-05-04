// src/components/DashboardCharts.tsx

"use client";

import { useEffect, useState } from "react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

type MonthData = {
  month: string;
  revenue: number;
  expenses: number;
};

type CategoryData = {
  category: string;
  amount: number;
};

type ChartData = {
  revenueByMonth: MonthData[];
  expenseByCategory: CategoryData[];
};

const CATEGORY_COLORS = [
  "#3B82F6",
  "#8B5CF6",
  "#10B981",
  "#F59E0B",
  "#EF4444",
  "#06B6D4",
  "#F97316",
  "#6B7280",
];

function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: any[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-lg p-3 text-sm">
      <p className="font-medium text-gray-700 mb-2">{label}</p>
      {payload.map((entry: any) => (
        <div key={entry.name} className="flex items-center gap-2">
          <span
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-gray-500 capitalize">{entry.name}:</span>
          <span className="font-medium text-gray-900">
            ${entry.value.toLocaleString()}
          </span>
        </div>
      ))}
    </div>
  );
}

function BarTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: any[];
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-lg p-3 text-sm">
      <p className="text-gray-500">{payload[0].payload.category}</p>
      <p className="font-semibold text-gray-900">
        ${payload[0].value.toLocaleString()}
      </p>
    </div>
  );
}

export default function DashboardCharts() {
  const [data, setData] = useState<ChartData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/dashboard/charts")
      .then((r) => r.json())
      .then((d) => {
        setData(d);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
        {[1, 2].map((i) => (
          <div
            key={i}
            className={`bg-white border border-gray-200 rounded-xl p-6 shadow-sm animate-pulse ${
              i === 1 ? "lg:col-span-2" : ""
            }`}
          >
            <div className="h-4 bg-gray-100 rounded w-32 mb-6" />
            <div className="h-52 bg-gray-50 rounded-lg" />
          </div>
        ))}
      </div>
    );
  }

  if (!data) return null;

  const hasRevenue = data.revenueByMonth.some(
    (d) => d.revenue > 0 || d.expenses > 0
  );
  const hasExpenses = data.expenseByCategory.length > 0;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">

      {/* Revenue vs Expenses area chart */}
      <div className="lg:col-span-2 bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-base font-semibold text-gray-900">
              Revenue vs Expenses
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">Last 6 months</p>
          </div>
          <div className="flex items-center gap-4 text-xs text-gray-500">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
              Revenue
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-red-400" />
              Expenses
            </span>
          </div>
        </div>

        {!hasRevenue ? (
          <div className="h-52 flex items-center justify-center text-sm text-gray-400">
            No data yet — mark invoices as paid to see revenue.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={data.revenueByMonth}>
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorExpenses" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#F87171" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#F87171" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
              <XAxis
                dataKey="month"
                tick={{ fontSize: 12, fill: "#9CA3AF" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 12, fill: "#9CA3AF" }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => `$${v.toLocaleString()}`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="revenue"
                stroke="#3B82F6"
                strokeWidth={2}
                fill="url(#colorRevenue)"
              />
              <Area
                type="monotone"
                dataKey="expenses"
                stroke="#F87171"
                strokeWidth={2}
                fill="url(#colorExpenses)"
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Expense breakdown bar chart */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
        <div className="mb-6">
          <h2 className="text-base font-semibold text-gray-900">
            Expense Breakdown
          </h2>
          <p className="text-xs text-gray-400 mt-0.5">By category</p>
        </div>

        {!hasExpenses ? (
          <div className="h-52 flex items-center justify-center text-sm text-gray-400 text-center">
            No expenses logged yet.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart
              data={data.expenseByCategory}
              layout="vertical"
              margin={{ left: 0, right: 16 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" horizontal={false} />
              <XAxis
                type="number"
                tick={{ fontSize: 11, fill: "#9CA3AF" }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => `$${v}`}
              />
              <YAxis
                type="category"
                dataKey="category"
                tick={{ fontSize: 11, fill: "#6B7280" }}
                axisLine={false}
                tickLine={false}
                width={90}
              />
              <Tooltip content={<BarTooltip />} />
              <Bar dataKey="amount" radius={[0, 4, 4, 0]}>
                {data.expenseByCategory.map((_, i) => (
                  <rect
                    key={i}
                    fill={CATEGORY_COLORS[i % CATEGORY_COLORS.length]}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}

        {/* Legend */}
        {hasExpenses && (
          <div className="mt-4 space-y-1.5">
            {data.expenseByCategory.slice(0, 4).map((item, i) => (
              <div key={item.category} className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-1.5 text-gray-500">
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: CATEGORY_COLORS[i % CATEGORY_COLORS.length] }}
                  />
                  {item.category}
                </span>
                <span className="font-medium text-gray-700">
                  ${item.amount.toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}