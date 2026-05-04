// src/app/dashboard/page.tsx

import { getCurrentMembership } from "@/lib/session";
import { DollarSign, Users, FileText, TrendingUp, ArrowRight, Activity } from "lucide-react";
import Link from "next/link";

// Mock data fetching functions - replace these with your actual Prisma queries
async function getDashboardStats() {
  // Example: await prisma.invoice.aggregate(...)
  return {
    totalRevenue: 24500,
    outstanding: 4200,
    activeClients: 12,
    monthlyGrowth: "+14%",
  };
}

async function getRecentActivity() {
  // Example: await prisma.invoice.findMany({ take: 5, orderBy: { createdAt: 'desc' } })
  return [
    { id: "1", type: "Invoice Paid", client: "Acme Corp", amount: "$1,200", time: "2 hours ago" },
    { id: "2", type: "New Client", client: "Globex Inc", amount: null, time: "5 hours ago" },
    { id: "3", type: "Invoice Sent", client: "Initech", amount: "$450", time: "1 day ago" },
  ];
}

export default async function DashboardPage() {
  const membership = await getCurrentMembership();
  
  // Fetch dashboard data in parallel for better performance
  const [stats, activities] = await Promise.all([
    getDashboardStats(),
    getRecentActivity(),
  ]);

  return (
    <div className="max-w-6xl mx-auto pb-12">
      {/* Header Section */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight mb-1">
          Welcome back 👋
        </h1>
        <p className="text-sm text-gray-500">
          Here is what is happening at <span className="font-medium text-gray-700">{membership.org.name}</span> today.
        </p>
      </div>

      {/* Top Level Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {/* Stat Card 1 */}
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

        {/* Stat Card 2 */}
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

        {/* Stat Card 3 */}
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
          <div className="flex items-center gap-3 text-gray-500 mb-2">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
              <FileText size={18} />
            </div>
            <h2 className="text-sm font-medium">Draft Invoices</h2>
          </div>
          <p className="text-2xl font-semibold text-gray-900">3</p>
        </div>

        {/* Stat Card 4 */}
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
          <div className="flex items-center gap-3 text-gray-500 mb-2">
            <div className="p-2 bg-purple-50 text-purple-600 rounded-lg">
              <Users size={18} />
            </div>
            <h2 className="text-sm font-medium">Active Clients</h2>
          </div>
          <p className="text-2xl font-semibold text-gray-900">{stats.activeClients}</p>
        </div>
      </div>

      {/* Main Dashboard Content Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Recent Activity (Takes up 2/3 of space on desktop) */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-base font-semibold text-gray-900">Recent Activity</h2>
              <Link href="/dashboard/reports" className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                View all
              </Link>
            </div>
            <div className="divide-y divide-gray-100">
              {activities.map((activity) => (
                <div key={activity.id} className="px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{activity.type}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{activity.client} · {activity.time}</p>
                  </div>
                  {activity.amount && (
                    <span className="text-sm font-medium text-gray-700">{activity.amount}</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Quick Actions (Takes up 1/3 of space on desktop) */}
        <div className="space-y-6">
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6">
            <h2 className="text-base font-semibold text-gray-900 mb-4">Quick Actions</h2>
            <div className="space-y-3">
              <Link 
                href="/dashboard/invoices/new" 
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
    </div>
  );
}