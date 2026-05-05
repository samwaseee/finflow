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
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar
        orgName={membership.org.name}
        currentOrgId={membership.org.id}
      />
      <main className="flex-1 p-6 md:p-8 overflow-auto">
        {children}
      </main>
    </div>
  );
}