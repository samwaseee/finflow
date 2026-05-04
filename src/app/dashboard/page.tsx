// src/app/dashboard/page.tsx

import { getCurrentMembership } from "@/lib/session";

export default async function DashboardPage() {
  const membership = await getCurrentMembership();

  return (
    <div>
      <h1 className="text-2xl font-semibold text-gray-900 mb-1">
        Welcome back 👋
      </h1>
      <p className="text-sm text-gray-500">
        {membership.org.name} · {membership.role}
      </p>
    </div>
  );
}