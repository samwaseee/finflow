// src/app/dashboard/reports/page.tsx

"use client";

import { useEffect, useState } from "react";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import {
  DollarSign, TrendingUp, TrendingDown, AlertTriangle,
  FileText, Users, Download, Calendar,
} from "lucide-react";
import { useTheme } from "next-themes";

type Summary = {
  totalRevenue: number;
  totalOutstanding: number;
  totalExpenses: number;
  netProfit: number;
  invoiceCount: number;
  clientCount: number;
  paidCount: number;
  overdueCount: number;
};

type ReportData = {
  summary: Summary;
  statusBreakdown: Record<string, number>;
  topClients: { name: string; revenue: number }[];
  expenseBreakdown: { category: string; amount: number }[];
  aging: Record<string, number>;
  monthlyTrend: { month: string; revenue: number; expenses: number }[];
  invoices: {
    number: string;
    client: string;
    status: string;
    total: number;
    dueDate: string;
    createdAt: string;
  }[];
  expenses: {
    category: string;
    amount: number;
    date: string;
    notes: string | null;
  }[];
};

const RANGES = [
  { label: "Last 30 days", value: "30" },
  { label: "Last 90 days", value: "90" },
  { label: "Last 6 months", value: "180" },
  { label: "Last year", value: "365" },
];

const COLORS = ["#3B82F6", "#8B5CF6", "#10B981", "#F59E0B", "#EF4444", "#06B6D4", "#F97316", "#6B7280"];

const STATUS_COLORS: Record<string, string> = {
  PAID: "#10B981",
  SENT: "#3B82F6",
  DRAFT: "#9CA3AF",
  OVERDUE: "#EF4444",
};

function StatCard({ label, value, icon: Icon, color, sub }: {
  label: string; value: string; icon: any; color: string; sub?: string;
}) {
  return (
    <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl p-5 shadow-sm">
      <div className="flex items-center gap-3 mb-2">
        <div className={`p-2 rounded-lg ${color}`}>
          <Icon size={16} />
        </div>
        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{label}</p>
      </div>
      <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{value}</p>
      {sub && <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{sub}</p>}
    </div>
  );
}

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl shadow-lg p-3 text-sm">
      <p className="font-medium text-gray-700 dark:text-gray-300 mb-1">{label}</p>
      {payload.map((entry: any) => (
        <div key={entry.name} className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color ?? entry.fill }} />
          <span className="text-gray-500 dark:text-gray-400">{entry.name}:</span>
          <span className="font-medium text-gray-900 dark:text-gray-100">
            ${Number(entry.value).toLocaleString()}
          </span>
        </div>
      ))}
    </div>
  );
}

export default function ReportsPage() {
  const [data, setData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState("30");
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  const gridColor  = isDark ? "#1e293b" : "#F3F4F6";
  const tickColor  = isDark ? "#94a3b8" : "#9CA3AF";
  const tickColorY = isDark ? "#94a3b8" : "#6B7280";

  async function fetchReport(r: string) {
    setLoading(true);
    const res = await fetch(`/api/reports?range=${r}`);
    setData(await res.json());
    setLoading(false);
  }

  useEffect(() => { fetchReport(range); }, [range]);

  function exportCSV(type: "invoices" | "expenses") {
    if (!data) return;
    let csv = "";
    if (type === "invoices") {
      csv = "Number,Client,Status,Total,Due Date,Created\n";
      csv += data.invoices.map((i) =>
        `${i.number},${i.client},${i.status},$${i.total},${new Date(i.dueDate).toLocaleDateString()},${new Date(i.createdAt).toLocaleDateString()}`
      ).join("\n");
    } else {
      csv = "Category,Amount,Date,Notes\n";
      csv += data.expenses.map((e) =>
        `${e.category},$${e.amount},${new Date(e.date).toLocaleDateString()},${e.notes ?? ""}`
      ).join("\n");
    }
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `${type}-report.csv`; a.click();
    URL.revokeObjectURL(url);
  }

  const agingData = data ? [
    { label: "Current",    amount: data.aging.current },
    { label: "1-30 days",  amount: data.aging.days30  },
    { label: "31-60 days", amount: data.aging.days60  },
    { label: "61-90 days", amount: data.aging.days90  },
    { label: "90+ days",   amount: data.aging.over90  },
  ] : [];

  const statusData = data
    ? Object.entries(data.statusBreakdown).map(([name, value]) => ({ name, value }))
    : [];

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto pb-12">
        <div className="h-8 bg-gray-100 dark:bg-slate-700 rounded w-32 mb-8 animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl p-5 h-28 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (!data) return null;
  const { summary } = data;

  return (
    <div className="max-w-6xl mx-auto pb-12">

      {/* Header */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Reports</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            Financial overview and insights
          </p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          {/* Range selector */}
          <div className="flex items-center gap-1 bg-gray-100 dark:bg-slate-700 p-1 rounded-lg">
            {RANGES.map((r) => (
              <button
                key={r.value}
                onClick={() => setRange(r.value)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  range === r.value
                    ? "bg-white dark:bg-slate-600 text-gray-900 dark:text-gray-100 shadow-sm"
                    : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>
          <button
            onClick={() => exportCSV("invoices")}
            className="flex items-center gap-2 border border-gray-200 dark:border-slate-600 text-gray-600 dark:text-gray-400 px-3 py-2 rounded-lg text-xs font-medium hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
          >
            <Download size={13} /> Invoices CSV
          </button>
          <button
            onClick={() => exportCSV("expenses")}
            className="flex items-center gap-2 border border-gray-200 dark:border-slate-600 text-gray-600 dark:text-gray-400 px-3 py-2 rounded-lg text-xs font-medium hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
          >
            <Download size={13} /> Expenses CSV
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          label="Total Revenue" value={`$${summary.totalRevenue.toLocaleString()}`}
          icon={DollarSign} color="bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400"
          sub={`${summary.paidCount} paid invoices`}
        />
        <StatCard
          label="Net Profit" value={`$${summary.netProfit.toLocaleString()}`}
          icon={summary.netProfit >= 0 ? TrendingUp : TrendingDown}
          color={summary.netProfit >= 0 ? "bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400" : "bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400"}
          sub={`Margin: ${summary.totalRevenue > 0 ? ((summary.netProfit / summary.totalRevenue) * 100).toFixed(0) : 0}%`}
        />
        <StatCard
          label="Outstanding" value={`$${summary.totalOutstanding.toLocaleString()}`}
          icon={AlertTriangle} color="bg-yellow-50 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400"
          sub={`${summary.overdueCount} overdue`}
        />
        <StatCard
          label="Total Expenses" value={`$${summary.totalExpenses.toLocaleString()}`}
          icon={TrendingDown} color="bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400"
          sub={`${summary.invoiceCount} invoices total`}
        />
      </div>

      {/* Charts row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">

        {/* Monthly trend */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl p-6 shadow-sm">
          <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-4">
            Revenue vs Expenses Trend
          </h2>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={data.monthlyTrend}>
              <defs>
                <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#3B82F6" stopOpacity={isDark ? 0.25 : 0.15} />
                  <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="exp" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#F87171" stopOpacity={isDark ? 0.25 : 0.15} />
                  <stop offset="95%" stopColor="#F87171" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: tickColor }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: tickColor }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${v}`} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="revenue"  name="Revenue"  stroke="#3B82F6" strokeWidth={2} fill="url(#rev)" />
              <Area type="monotone" dataKey="expenses" name="Expenses" stroke="#F87171" strokeWidth={2} fill="url(#exp)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Invoice status pie */}
        <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl p-6 shadow-sm">
          <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-4">
            Invoice Status
          </h2>
          {summary.invoiceCount === 0 ? (
            <div className="h-48 flex items-center justify-center text-sm text-gray-400 dark:text-gray-500">
              No invoices yet
            </div>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie data={statusData} cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={3} dataKey="value">
                    {statusData.map((entry) => (
                      <Cell key={entry.name} fill={STATUS_COLORS[entry.name] ?? "#9CA3AF"} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(v) => [`${v} invoices`]}
                    contentStyle={{
                      background: isDark ? "#1e293b" : "#fff",
                      border: `1px solid ${isDark ? "#334155" : "#e5e7eb"}`,
                      borderRadius: "12px",
                      color: isDark ? "#f1f5f9" : "#111827",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-1.5 mt-2">
                {statusData.map((entry) => (
                  <div key={entry.name} className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-1.5 text-gray-500 dark:text-gray-400">
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: STATUS_COLORS[entry.name] ?? "#9CA3AF" }} />
                      {entry.name}
                    </span>
                    <span className="font-medium text-gray-700 dark:text-gray-300">{entry.value}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Charts row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">

        {/* Top clients */}
        <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Users size={15} className="text-gray-400 dark:text-gray-500" />
            <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Top Clients</h2>
          </div>
          {data.topClients.length === 0 ? (
            <div className="h-32 flex items-center justify-center text-sm text-gray-400 dark:text-gray-500">
              No paid invoices yet
            </div>
          ) : (
            <div className="space-y-3">
              {data.topClients.map((client, i) => {
                const max = data.topClients[0].revenue;
                const pct = max > 0 ? (client.revenue / max) * 100 : 0;
                return (
                  <div key={client.name}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-gray-700 dark:text-gray-300 font-medium truncate pr-2">
                        {client.name}
                      </span>
                      <span className="text-gray-500 dark:text-gray-400 flex-shrink-0">
                        ${client.revenue.toLocaleString()}
                      </span>
                    </div>
                    <div className="h-1.5 bg-gray-100 dark:bg-slate-700 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{ width: `${pct}%`, backgroundColor: COLORS[i % COLORS.length] }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Expense breakdown */}
        <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl p-6 shadow-sm">
          <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-4">
            Expense Breakdown
          </h2>
          {data.expenseBreakdown.length === 0 ? (
            <div className="h-32 flex items-center justify-center text-sm text-gray-400 dark:text-gray-500">
              No expenses yet
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={data.expenseBreakdown} layout="vertical" margin={{ left: 0, right: 16 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={gridColor} horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 10, fill: tickColor }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${v}`} />
                <YAxis type="category" dataKey="category" tick={{ fontSize: 10, fill: tickColorY }} axisLine={false} tickLine={false} width={80} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="amount" name="Amount" radius={[0, 4, 4, 0]}>
                  {data.expenseBreakdown.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Invoice aging */}
        <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Calendar size={15} className="text-gray-400 dark:text-gray-500" />
            <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
              Invoice Aging
            </h2>
          </div>
          {agingData.every((a) => a.amount === 0) ? (
            <div className="h-32 flex items-center justify-center text-sm text-gray-400 dark:text-gray-500">
              No outstanding invoices
            </div>
          ) : (
            <div className="space-y-3">
              {agingData.map((bucket, i) => {
                const agingTotal = agingData.reduce((s, a) => s + a.amount, 0);
                const pct = agingTotal > 0 ? (bucket.amount / agingTotal) * 100 : 0;
                const colors = ["#10B981", "#F59E0B", "#F97316", "#EF4444", "#7F1D1D"];
                return (
                  <div key={bucket.label}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-gray-600 dark:text-gray-400">{bucket.label}</span>
                      <span className="font-medium text-gray-700 dark:text-gray-300">
                        ${bucket.amount.toLocaleString()}
                      </span>
                    </div>
                    <div className="h-1.5 bg-gray-100 dark:bg-slate-700 rounded-full overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: colors[i] }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Invoice summary table */}
      <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl shadow-sm overflow-hidden mb-6">
        <div className="px-6 py-4 border-b border-gray-100 dark:border-slate-700 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText size={15} className="text-gray-400 dark:text-gray-500" />
            <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
              Invoice Summary
            </h2>
          </div>
          <span className="text-xs text-gray-400 dark:text-gray-500">{data.invoices.length} invoices</span>
        </div>
        {data.invoices.length === 0 ? (
          <div className="py-12 text-center text-sm text-gray-400 dark:text-gray-500">
            No invoices in this period
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 dark:border-slate-700 bg-gray-50 dark:bg-slate-700/30">
                  <th className="text-left px-5 py-3 font-medium text-gray-500 dark:text-gray-400">Number</th>
                  <th className="text-left px-5 py-3 font-medium text-gray-500 dark:text-gray-400">Client</th>
                  <th className="text-left px-5 py-3 font-medium text-gray-500 dark:text-gray-400">Status</th>
                  <th className="text-left px-5 py-3 font-medium text-gray-500 dark:text-gray-400">Due Date</th>
                  <th className="text-right px-5 py-3 font-medium text-gray-500 dark:text-gray-400">Total</th>
                </tr>
              </thead>
              <tbody>
                {data.invoices.slice(0, 10).map((inv) => (
                  <tr
                    key={inv.number}
                    className="border-b border-gray-100 dark:border-slate-700/50 last:border-0 hover:bg-gray-50 dark:hover:bg-slate-700/40 transition-colors"
                  >
                    <td className="px-5 py-3 font-mono text-xs text-gray-600 dark:text-gray-400">
                      {inv.number}
                    </td>
                    <td className="px-5 py-3 text-gray-900 dark:text-gray-100 font-medium">
                      {inv.client}
                    </td>
                    <td className="px-5 py-3">
                      <span
                        className="px-2 py-0.5 rounded-full text-xs font-medium"
                        style={{
                          backgroundColor: `${STATUS_COLORS[inv.status]}${isDark ? "40" : "20"}`,
                          color: STATUS_COLORS[inv.status],
                        }}
                      >
                        {inv.status}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-gray-500 dark:text-gray-400 text-xs">
                      {new Date(inv.dueDate).toLocaleDateString("en-US", {
                        month: "short", day: "numeric", year: "numeric",
                      })}
                    </td>
                    <td className="px-5 py-3 text-right font-medium text-gray-900 dark:text-gray-100">
                      ${inv.total.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}