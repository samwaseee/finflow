// src/app/dashboard/Sidebar.tsx

"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  FileText, 
  Users, 
  DollarSign, 
  PieChart, 
  Settings,
  Menu,
  X
} from "lucide-react";

const navItems = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/dashboard/invoices", label: "Invoices", icon: FileText },
  { href: "/dashboard/clients", label: "Clients", icon: Users },
  { href: "/dashboard/expenses", label: "Expenses", icon: DollarSign },
  { href: "/dashboard/reports", label: "Reports", icon: PieChart },
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
];

export default function Sidebar({ orgName }: { orgName: string }) {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <>
      {/* Mobile Topbar */}
      <div className="md:hidden flex items-center justify-between bg-white border-b border-gray-200 p-4 shrink-0">
        <p className="font-semibold text-gray-900 truncate pr-4">{orgName}</p>
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/20"
        >
          {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Mobile Overlay Backdrop */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar Navigation */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 p-5 flex flex-col transition-transform duration-200 ease-in-out
          md:relative md:w-64 md:translate-x-0
          ${isMobileMenuOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full"}
        `}
      >
        <p className="hidden md:block text-sm font-semibold text-gray-900 mb-6 truncate px-3">
          {orgName}
        </p>

        <nav className="flex flex-col gap-1.5 flex-1">
          {navItems.map((item) => {
            // Check if the current route matches the link
            const isActive = pathname === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsMobileMenuOpen(false)} // Close menu on mobile click
                className={`
                  flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors
                  ${isActive 
                    ? "bg-blue-50 text-blue-700" 
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                  }
                `}
              >
                <item.icon size={18} className={isActive ? "text-blue-600" : "text-gray-400"} />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>
    </>
  );
}