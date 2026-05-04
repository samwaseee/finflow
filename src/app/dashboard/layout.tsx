// src/app/dashboard/layout.tsx

import { getCurrentMembership } from "@/lib/session";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const membership = await getCurrentMembership();

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <aside className="w-56 bg-white border-r border-gray-200 p-5 flex flex-col gap-1">
        <p className="text-sm font-semibold text-gray-900 mb-4 truncate">
          {membership.org.name}
        </p>
        {[
          { href: "/dashboard", label: "Overview" },
          { href: "/dashboard/invoices", label: "Invoices" },
          { href: "/dashboard/clients", label: "Clients" },
          { href: "/dashboard/expenses", label: "Expenses" },
          { href: "/dashboard/reports", label: "Reports" },
          { href: "/dashboard/settings", label: "Settings" },
        ].map((item) => (
          <a
            key={item.href}
            href={item.href}
            className="text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg px-3 py-2 transition-colors"
          >
            {item.label}
          </a>
        ))}
      </aside>
      <main className="flex-1 p-8">{children}</main>
    </div>
  );
}