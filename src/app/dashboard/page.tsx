import { getCurrentMembership } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { DollarSign, Users, FileText, TrendingUp, ArrowRight, Activity } from "lucide-react";
import Link from "next/link";
import DashboardCharts from "@/components/DashboardCharts";
import CashFlowForecast from "@/components/CashFlowForecast";

// Helper to format money — shows "—" if zero and no data yet
function formatMoney(amount: number, hasData: boolean) {
  if (!hasData && amount === 0) return "—";
  return `$${amount.toLocaleString()}`;
}

async function getDashboardStats(orgId: string) {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

  const [
    paidInvoices,
    outstandingInvoices,
    draftCount,
    clientCount,
    lastMonthPaid,
  ] = await Promise.all([
    prisma.invoice.aggregate({
      where: { orgId, status: "PAID" },
      _sum: { total: true },
    }),
    prisma.invoice.aggregate({
      where: { orgId, status: { in: ["SENT", "OVERDUE"] } },
      _sum: { total: true },
    }),
    prisma.invoice.count({ where: { orgId, status: "DRAFT" } }),
    prisma.client.count({ where: { orgId } }),
    prisma.invoice.aggregate({
      where: {
        orgId,
        status: "PAID",
        createdAt: { gte: startOfLastMonth, lte: endOfLastMonth },
      },
      _sum: { total: true },
    }),
  ]);

  const totalRevenue = Number(paidInvoices._sum.total ?? 0);
  const outstanding = Number(outstandingInvoices._sum.total ?? 0);
  const lastMonthRevenue = Number(lastMonthPaid._sum.total ?? 0);

  let monthlyGrowth = "+0%";
  if (lastMonthRevenue > 0) {
    const thisMonthPaid = await prisma.invoice.aggregate({
      where: { orgId, status: "PAID", createdAt: { gte: startOfMonth } },
      _sum: { total: true },
    });
    const thisMonth = Number(thisMonthPaid._sum.total ?? 0);
    const growth = ((thisMonth - lastMonthRevenue) / lastMonthRevenue) * 100;
    monthlyGrowth = `${growth >= 0 ? "+" : ""}${growth.toFixed(0)}%`;
  }

  return { totalRevenue, outstanding, draftCount, clientCount, monthlyGrowth };
}

async function getRecentActivity(orgId: string) {
  const [recentInvoices, recentClients] = await Promise.all([
    prisma.invoice.findMany({
      where: { orgId },
      orderBy: { createdAt: "desc" },
      take: 4,
      include: { client: { select: { name: true } } },
    }),
    prisma.client.findMany({
      where: { orgId },
      orderBy: { createdAt: "desc" },
      take: 2,
    }),
  ]);

  type ActivityItem = {
    id: string;
    type: string;
    client: string;
    amount: string | null;
    time: string;
    createdAt: Date;
  };

  const STATUS_LABEL: Record<string, string> = {
    DRAFT: "Invoice Created",
    SENT: "Invoice Sent",
    PAID: "Invoice Paid",
    OVERDUE: "Invoice Overdue",
  };

  function timeAgo(date: Date) {
    const diff = Date.now() - date.getTime();
    const mins = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    if (mins < 60) return `${mins}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  }

  // The Fix: Added explicit inline type for 'inv'
  const invoiceItems: ActivityItem[] = recentInvoices.map((inv: { id: string; status: string; total: any; createdAt: Date; client: { name: string } }) => ({
    id: inv.id,
    type: STATUS_LABEL[inv.status] ?? "Invoice Updated",
    client: inv.client.name,
    amount: `$${Number(inv.total).toFixed(2)}`,
    time: timeAgo(inv.createdAt),
    createdAt: inv.createdAt,
  }));

  // The Fix: Added explicit inline type for 'c' to prevent the next sequential build error
  const clientItems: ActivityItem[] = recentClients.map((c: { id: string; name: string; createdAt: Date }) => ({
    id: c.id,
    type: "New Client Added",
    client: c.name,
    amount: null,
    time: timeAgo(c.createdAt),
    createdAt: c.createdAt,
  }));

  return [...invoiceItems, ...clientItems]
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .slice(0, 5);
}

export default async function DashboardPage() {
  const membership = await getCurrentMembership();
  const orgId = membership.orgId;

  const [stats, activities] = await Promise.all([
    getDashboardStats(orgId),
    getRecentActivity(orgId),
  ]);

  const hasData = stats.totalRevenue > 0 || stats.clientCount > 0 || stats.draftCount > 0;

  return (
    <div className="max-w-6xl mx-auto pb-12">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 tracking-tight mb-1">
          Welcome back,
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Here is what is happening at{" "}
          <span className="font-bold text-xl text-gray-700 dark:text-gray-300">
            {membership.org.name}
          </span>{" "}
          today.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl p-5 shadow-sm">
          <div className="flex items-center gap-3 text-gray-500 dark:text-gray-400 mb-2">
            <div className="p-2 bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-lg">
              <DollarSign size={18} />
            </div>
            <h2 className="text-sm font-medium">Total Revenue</h2>
          </div>
          <div className="flex items-baseline gap-2">
            <p className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
              {formatMoney(stats.totalRevenue, hasData)}
            </p>
            <span className="text-xs font-medium text-green-600 dark:text-green-400 flex items-center">
              <TrendingUp size={12} className="mr-0.5" />
              {stats.monthlyGrowth}
            </span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl p-5 shadow-sm">
          <div className="flex items-center gap-3 text-gray-500 dark:text-gray-400 mb-2">
            <div className="p-2 bg-orange-50 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 rounded-lg">
              <Activity size={18} />
            </div>
            <h2 className="text-sm font-medium">Outstanding</h2>
          </div>
          <p className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
            {formatMoney(stats.outstanding, hasData)}
          </p>
        </div>

        <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl p-5 shadow-sm">
          <div className="flex items-center gap-3 text-gray-500 dark:text-gray-400 mb-2">
            <div className="p-2 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg">
              <FileText size={18} />
            </div>
            <h2 className="text-sm font-medium">Draft Invoices</h2>
          </div>
          <p className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
            {!hasData && stats.draftCount === 0 ? "—" : stats.draftCount}
          </p>
        </div>

        <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl p-5 shadow-sm">
          <div className="flex items-center gap-3 text-gray-500 dark:text-gray-400 mb-2">
            <div className="p-2 bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-lg">
              <Users size={18} />
            </div>
            <h2 className="text-sm font-medium">Active Clients</h2>
          </div>
          <p className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
            {!hasData && stats.clientCount === 0 ? "—" : stats.clientCount}
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Activity */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 dark:border-slate-700 flex items-center justify-between">
              <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">
                Recent Activity
              </h2>
              <Link
                href="/dashboard/invoices"
                className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium"
              >
                View all
              </Link>
            </div>
            <div className="divide-y divide-gray-100 dark:divide-slate-700">
              {activities.length === 0 ? (
                <div className="px-6 py-10 text-center">
                  <div className="w-10 h-10 rounded-full bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center mx-auto mb-3">
                    <Activity size={18} className="text-blue-500 dark:text-blue-400" />
                  </div>
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    No activity yet
                  </p>
                  <p className="text-xs text-gray-400 dark:text-gray-500">
                    Create your first invoice or add a client to get started.
                  </p>
                </div>
              ) : (
                activities.map((activity) => (
                  <div
                    key={activity.id}
                    className="px-6 py-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors"
                  >
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {activity.type}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                        {activity.client} · {activity.time}
                      </p>
                    </div>
                    {activity.amount && (
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        {activity.amount}
                      </span>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl shadow-sm p-6">
            <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-4">
              Quick Actions
            </h2>
            <div className="space-y-3">
              {[
                { href: "/dashboard/invoices", label: "Create New Invoice" },
                { href: "/dashboard/clients",  label: "Add New Client"    },
                { href: "/dashboard/expenses", label: "Log an Expense"    },
              ].map((action) => (
                <Link
                  key={action.href}
                  href={action.href}
                  className="w-full flex items-center justify-between p-3 border border-gray-200 dark:border-slate-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:text-blue-700 dark:hover:text-blue-400 transition-all group"
                >
                  {action.label}
                  <ArrowRight
                    size={16}
                    className="text-gray-400 dark:text-gray-500 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors"
                  />
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>

      <DashboardCharts key={membership.orgId} orgId={membership.orgId} />
      <CashFlowForecast key={`forecast-${membership.orgId}`} orgId={membership.orgId} />

    </div>
  );
}