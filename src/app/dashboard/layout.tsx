// src/app/dashboard/layout.tsx

import { getCurrentMembership } from "@/lib/session";
import Sidebar from "./SIdebar";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const membership = await getCurrentMembership();

  return (
    <div className="h-screen flex overflow-hidden bg-gray-100 dark:bg-slate-900">
      {/* Sidebar wrapper — adds the gap around the floating sidebar */}
      <div className="hidden md:flex w-[17rem] flex-shrink-0 h-screen p-3">
        <Sidebar
          orgName={membership.org.name}
          currentOrgId={membership.org.id}
        />
      </div>

      {/* Mobile sidebar */}
      <div className="md:hidden">
        <Sidebar
          orgName={membership.org.name}
          currentOrgId={membership.org.id}
        />
      </div>

      {/* Main content */}
      <main className="flex-1 min-w-0 h-screen overflow-y-auto p-4 md:p-6 pr-4">
        {children}
      </main>
    </div>
  );
}