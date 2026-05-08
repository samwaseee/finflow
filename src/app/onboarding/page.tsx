// src/app/onboarding/page.tsx

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Loader2 } from "lucide-react";

export default function OnboardingPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [error, setError] = useState("");

  // Check if user already has an org — if so skip onboarding
  useEffect(() => {
    async function checkOrg() {
      try {
        const res = await fetch("/api/orgs");
        const orgs = await res.json();
        if (Array.isArray(orgs) && orgs.length > 0) {
          // User already has an org — set the active one and go to dashboard
          await fetch("/api/orgs/switch", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ orgId: orgs[0].id }),
          });
          router.replace("/dashboard");
        } else {
          setChecking(false);
        }
      } catch {
        setChecking(false);
      }
    }
    if (session?.user?.id) checkOrg();
  }, [session]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    setError("");

    const res = await fetch("/api/orgs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });

    if (res.ok) {
      const org = await res.json();
      // Set as active org
      await fetch("/api/orgs/switch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orgId: org.id }),
      });
      router.push("/dashboard");
    } else {
      const data = await res.json();
      setError(data.error || "Something went wrong.");
      setLoading(false);
    }
  }

  // Show spinner while checking
  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-900">
        <div className="flex flex-col items-center gap-3 text-gray-400 dark:text-gray-500">
          <Loader2 size={24} className="animate-spin" />
          <p className="text-sm">Loading your workspace...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-900">
      <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-2xl p-10 w-full max-w-sm shadow-xl shadow-black/5 dark:shadow-black/30">
        <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-1">
          Create your organization
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
          Welcome{session?.user?.name ? `, ${session.user.name}` : ""}. Let's set up your workspace.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Organization name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Acme Inc."
              className="w-full border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
              required
            />
          </div>

          {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white rounded-lg px-4 py-2.5 text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {loading && <Loader2 size={14} className="animate-spin" />}
            {loading ? "Creating..." : "Create organization"}
          </button>
        </form>
      </div>
    </div>
  );
}