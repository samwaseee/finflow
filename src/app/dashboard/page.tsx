// src/app/dashboard/page.tsx

import { getCurrentMembership } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { DollarSign, Users, FileText, TrendingUp, ArrowRight, Activity } from "lucide-react";
import Link from "next/link";
import DashboardCharts from "@/components/DashboardCharts";
import CashFlowForecast from "@/components/CashFlowForecast";

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
    // Total revenue = all PAID invoices
    prisma.invoice.aggregate({
      where: { orgId, status: "PAID" },
      _sum: { total: true },
    }),
    // Outstanding = SENT + OVERDUE invoices
    prisma.invoice.aggregate({
      where: { orgId, status: { in: ["SENT", "OVERDUE"] } },
      _sum: { total: true },
    }),
    // Draft invoice count
    prisma.invoice.count({
      where: { orgId, status: "DRAFT" },
    }),
    // Total clients
    prisma.client.count({ where: { orgId } }),
    // Last month revenue for growth calculation
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

  // Calculate month-over-month growth
  let monthlyGrowth = "+0%";
  if (lastMonthRevenue > 0) {
    const thisMonthPaid = await prisma.invoice.aggregate({
      where: {
        orgId,
        status: "PAID",
        createdAt: { gte: startOfMonth },
      },
      _sum: { total: true },
    });
    const thisMonth = Number(thisMonthPaid._sum.total ?? 0);
    const growth = ((thisMonth - lastMonthRevenue) / lastMonthRevenue) * 100;
    monthlyGrowth = `${growth >= 0 ? "+" : ""}${growth.toFixed(0)}%`;
  }

  return {
    totalRevenue,
    outstanding,
    draftCount,
    clientCount,
    monthlyGrowth,
  };
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

  const invoiceItems: ActivityItem[] = recentInvoices.map((inv) => ({
    id: inv.id,
    type: STATUS_LABEL[inv.status] ?? "Invoice Updated",
    client: inv.client.name,
    amount: `$${Number(inv.total).toFixed(2)}`,
    time: timeAgo(inv.createdAt),
    createdAt: inv.createdAt,
  }));

  const clientItems: ActivityItem[] = recentClients.map((c) => ({
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

  return (
    <div className="max-w-6xl mx-auto pb-12">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight mb-1">
          Welcome back 👋
        </h1>
        <p className="text-sm text-gray-500">
          Here is what is happening at{" "}
          <span className="font-medium text-gray-700">{membership.org.name}</span> today.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
          <div className="flex items-center gap-3 text-gray-500 mb-2">
            <div className="p-2 bg-green-50 text-green-600 rounded-lg">
              <DollarSign size={18} />
            </div>
            <h2 className="text-sm font-medium">Total Revenue</h2>
          </div>
          <div className="flex items-baseline gap-2">
            <p className="text-2xl font-semibold text-gray-900">
              ${stats.totalRevenue.toLocaleString()}
            </p>
            <span className="text-xs font-medium text-green-600 flex items-center">
              <TrendingUp size={12} className="mr-0.5" />
              {stats.monthlyGrowth}
            </span>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
          <div className="flex items-center gap-3 text-gray-500 mb-2">
            <div className="p-2 bg-orange-50 text-orange-600 rounded-lg">
              <Activity size={18} />
            </div>
            <h2 className="text-sm font-medium">Outstanding</h2>
          </div>
          <p className="text-2xl font-semibold text-gray-900">
            ${stats.outstanding.toLocaleString()}
          </p>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
          <div className="flex items-center gap-3 text-gray-500 mb-2">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
              <FileText size={18} />
            </div>
            <h2 className="text-sm font-medium">Draft Invoices</h2>
          </div>
          <p className="text-2xl font-semibold text-gray-900">{stats.draftCount}</p>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
          <div className="flex items-center gap-3 text-gray-500 mb-2">
            <div className="p-2 bg-purple-50 text-purple-600 rounded-lg">
              <Users size={18} />
            </div>
            <h2 className="text-sm font-medium">Active Clients</h2>
          </div>
          <p className="text-2xl font-semibold text-gray-900">{stats.clientCount}</p>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* Recent Activity */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-base font-semibold text-gray-900">Recent Activity</h2>
              <Link
                href="/dashboard/invoices"
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                View all
              </Link>
            </div>
            <div className="divide-y divide-gray-100">
              {activities.length === 0 ? (
                <p className="px-6 py-8 text-sm text-gray-400 text-center">
                  No activity yet — create your first invoice to get started.
                </p>
              ) : (
                activities.map((activity) => (
                  <div
                    key={activity.id}
                    className="px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
                  >
                    <div>
                      <p className="text-sm font-medium text-gray-900">{activity.type}</p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {activity.client} · {activity.time}
                      </p>
                    </div>
                    {activity.amount && (
                      <span className="text-sm font-medium text-gray-700">
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
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6">
            <h2 className="text-base font-semibold text-gray-900 mb-4">Quick Actions</h2>
            <div className="space-y-3">
              <Link
                href="/dashboard/invoices"
                className="w-full flex items-center justify-between p-3 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:border-blue-500 hover:bg-blue-50 hover:text-blue-700 transition-all group"
              >
                Create New Invoice
                <ArrowRight size={16} className="text-gray-400 group-hover:text-blue-600 transition-colors" />
              </Link>
              <Link
                href="/dashboard/clients"
                className="w-full flex items-center justify-between p-3 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:border-blue-500 hover:bg-blue-50 hover:text-blue-700 transition-all group"
              >
                Add New Client
                <ArrowRight size={16} className="text-gray-400 group-hover:text-blue-600 transition-colors" />
              </Link>
              <Link
                href="/dashboard/expenses"
                className="w-full flex items-center justify-between p-3 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:border-blue-500 hover:bg-blue-50 hover:text-blue-700 transition-all group"
              >
                Log an Expense
                <ArrowRight size={16} className="text-gray-400 group-hover:text-blue-600 transition-colors" />
              </Link>
            </div>
          </div>
        </div>

      </div>

      <DashboardCharts />

      <CashFlowForecast />

    </div>
  );
}