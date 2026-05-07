// src/components/Sidebar.tsx

"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import {
  LayoutDashboard, FileText, Users, DollarSign,
  PieChart, Settings, Menu, X, LogOut, ChevronUp,
} from "lucide-react";
import OrgSwitcher from "@/components/OrgSwitcher";
import ThemeToggle from "@/components/ThemeToggle";

const navItems = [
  { href: "/dashboard",          label: "Overview",  icon: LayoutDashboard },
  { href: "/dashboard/invoices", label: "Invoices",  icon: FileText        },
  { href: "/dashboard/clients",  label: "Clients",   icon: Users           },
  { href: "/dashboard/expenses", label: "Expenses",  icon: DollarSign      },
  { href: "/dashboard/reports",  label: "Reports",   icon: PieChart        },
  { href: "/dashboard/settings", label: "Settings",  icon: Settings        },
];

export default function Sidebar({
  orgName,
  currentOrgId,
}: {
  orgName: string;
  currentOrgId: string;
}) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const initials = session?.user?.name
    ? session.user.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : "?";

  return (
    <>
      {/* Mobile Topbar */}
      <div className="md:hidden flex items-center justify-between bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700 p-4 shrink-0">
        <p className="font-semibold text-gray-900 dark:text-gray-100 truncate pr-4">
          {orgName}
        </p>
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
        >
          {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/30 dark:bg-black/50 backdrop-blur-sm z-40 md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          sidebar-float
          w-full h-full
          bg-white/95 dark:bg-slate-800/95
          backdrop-blur-xl
          border border-gray-200/80 dark:border-slate-700/60
          rounded-2xl
          flex flex-col
          shadow-xl shadow-black/5 dark:shadow-black/40
          overflow-hidden
          relative
          transition-transform duration-300 ease-in-out
          md:translate-x-0
          ${isMobileMenuOpen ? "translate-x-0" : "-translate-x-[110%] md:translate-x-0"}
        `}
      >
        {/* Top glow */}
        <div className="absolute top-0 left-0 right-0 h-36 bg-gradient-to-b from-blue-500/10 dark:from-blue-400/20 to-transparent pointer-events-none rounded-t-2xl z-0" />

        {/* Bottom glow */}
        <div className="absolute bottom-0 left-0 right-0 h-36 bg-gradient-to-t from-purple-500/10 dark:from-purple-400/20 to-transparent pointer-events-none rounded-b-2xl z-0" />

        {/* Content sits above glows */}
        <div className="relative z-10 flex flex-col h-full">

          {/* Org switcher */}
          <div className="p-3 border-b border-gray-100/80 dark:border-slate-700/80">
            <OrgSwitcher currentOrgId={currentOrgId} />
          </div>

          {/* Nav links */}
          <nav className="flex flex-col gap-0.5 flex-1 p-2.5 overflow-y-auto">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`
                    flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150
                    ${isActive
                      ? "bg-blue-50 dark:bg-blue-500/15 text-blue-700 dark:text-blue-400 shadow-sm"
                      : "text-gray-600 dark:text-gray-400 hover:bg-gray-50/80 dark:hover:bg-slate-700/60 hover:text-gray-900 dark:hover:text-gray-100"
                    }
                  `}
                >
                  <item.icon
                    size={16}
                    className={isActive ? "text-blue-600 dark:text-blue-400" : "text-gray-400 dark:text-gray-500"}
                  />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* Theme toggle */}
          <div className="px-4 py-3 flex items-center justify-between border-t border-gray-100/80 dark:border-slate-700/80">
            <span className="text-xs text-gray-400 dark:text-gray-500">Theme</span>
            <ThemeToggle />
          </div>

          {/* User menu */}
          <div className="p-3 border-t border-gray-100/80 dark:border-slate-700/80 relative">
            <button
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-gray-50/80 dark:hover:bg-slate-700/60 transition-colors"
            >
              {session?.user?.image ? (
                <img
                  src={session.user.image}
                  alt="avatar"
                  className="w-8 h-8 rounded-full object-cover flex-shrink-0 ring-2 ring-gray-100 dark:ring-slate-700"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-400 flex items-center justify-center text-xs font-semibold flex-shrink-0">
                  {initials}
                </div>
              )}
              <div className="flex-1 text-left min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                  {session?.user?.name ?? "User"}
                </p>
                <p className="text-xs text-gray-400 dark:text-gray-500 truncate">
                  {session?.user?.email ?? ""}
                </p>
              </div>
              <ChevronUp
                size={14}
                className={`text-gray-400 dark:text-gray-500 transition-transform flex-shrink-0 ${
                  userMenuOpen ? "rotate-180" : ""
                }`}
              />
            </button>

            {/* Dropdown */}
            {userMenuOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setUserMenuOpen(false)} />
                <div className="absolute bottom-full left-3 right-3 mb-2 bg-white/95 dark:bg-slate-800/95 backdrop-blur-xl border border-gray-200/80 dark:border-slate-700/60 rounded-2xl shadow-xl dark:shadow-slate-900/50 z-20 overflow-hidden">
                  <div className="px-4 py-3 border-b border-gray-100 dark:border-slate-700">
                    <p className="text-xs font-medium text-gray-900 dark:text-gray-100 truncate">
                      {session?.user?.name}
                    </p>
                    <p className="text-xs text-gray-400 dark:text-gray-500 truncate">
                      {session?.user?.email}
                    </p>
                  </div>
                  <div className="p-1">
                    <Link
                      href="/dashboard/settings"
                      onClick={() => { setUserMenuOpen(false); setIsMobileMenuOpen(false); }}
                      className="flex items-center gap-2.5 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700/60 rounded-xl transition-colors"
                    >
                      <Settings size={14} className="text-gray-400 dark:text-gray-500" />
                      Settings
                    </Link>
                    <button
                      onClick={() => signOut({ callbackUrl: "/login" })}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors"
                    >
                      <LogOut size={14} />
                      Sign out
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>

        </div>
      </aside>

      {/* Mobile fixed positioning */}
      <style>{`
        @media (max-width: 767px) {
          .sidebar-float {
            position: fixed;
            top: 0.75rem;
            bottom: 0.75rem;
            left: 0.75rem;
            width: 15rem;
            height: auto;
          }
        }
      `}</style>
    </>
  );
}