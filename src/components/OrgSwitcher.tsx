// src/components/OrgSwitcher.tsx

"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, ChevronsUpDown, Plus, Building2, Loader2 } from "lucide-react";

type Org = {
  id: string;
  name: string;
  slug: string;
  role: string;
};

export default function OrgSwitcher({ currentOrgId }: { currentOrgId: string }) {
  const router = useRouter();
  const [orgs, setOrgs] = useState<Org[]>([]);
  const [open, setOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newOrgName, setNewOrgName] = useState("");
  const [saving, setSaving] = useState(false);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    fetch("/api/orgs").then((r) => r.json()).then(setOrgs);
  }, []);

  const currentOrg = orgs.find((o) => o.id === currentOrgId);

  async function handleSwitch(orgId: string) {
    if (orgId === currentOrgId) { setOpen(false); return; }

    await fetch("/api/orgs/switch", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orgId }),
    });

    setOpen(false);
    startTransition(() => router.refresh());
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!newOrgName.trim()) return;
    setSaving(true);

    const res = await fetch("/api/orgs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newOrgName }),
    });

    if (res.ok) {
      const org = await res.json();
      // switch to new org immediately
      await fetch("/api/orgs/switch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orgId: org.id }),
      });
      setNewOrgName("");
      setCreating(false);
      setOpen(false);
      startTransition(() => router.refresh());
    }

    setSaving(false);
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors group"
      >
        <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center flex-shrink-0">
          <span className="text-white text-xs font-bold">
            {currentOrg?.name.charAt(0).toUpperCase() ?? "?"}
          </span>
        </div>
        <div className="flex-1 text-left min-w-0">
          <p className="text-sm font-semibold text-gray-900 truncate">
            {currentOrg?.name ?? "Loading..."}
          </p>
          <p className="text-xs text-gray-400 capitalize">
            {currentOrg?.role.toLowerCase()}
          </p>
        </div>
        {isPending ? (
          <Loader2 size={14} className="text-gray-400 animate-spin flex-shrink-0" />
        ) : (
          <ChevronsUpDown size={14} className="text-gray-400 flex-shrink-0" />
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-20 overflow-hidden">

            {/* Org list */}
            <div className="p-1">
              <p className="px-3 py-1.5 text-xs font-medium text-gray-400 uppercase tracking-wide">
                Your organizations
              </p>
              {orgs.map((org) => (
                <button
                  key={org.id}
                  onClick={() => handleSwitch(org.id)}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-50 transition-colors text-left"
                >
                  <div className="w-6 h-6 rounded-md bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-semibold flex-shrink-0">
                    {org.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {org.name}
                    </p>
                    <p className="text-xs text-gray-400 capitalize">
                      {org.role.toLowerCase()}
                    </p>
                  </div>
                  {org.id === currentOrgId && (
                    <Check size={14} className="text-blue-600 flex-shrink-0" />
                  )}
                </button>
              ))}
            </div>

            <div className="border-t border-gray-100 p-1">
              {creating ? (
                <form onSubmit={handleCreate} className="p-2 space-y-2">
                  <input
                    autoFocus
                    type="text"
                    value={newOrgName}
                    onChange={(e) => setNewOrgName(e.target.value)}
                    placeholder="Organization name"
                    className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setCreating(false)}
                      className="flex-1 border border-gray-200 text-gray-600 rounded-lg py-1.5 text-xs font-medium hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={saving}
                      className="flex-1 bg-blue-600 text-white rounded-lg py-1.5 text-xs font-medium hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-1"
                    >
                      {saving && <Loader2 size={11} className="animate-spin" />}
                      Create
                    </button>
                  </div>
                </form>
              ) : (
                <button
                  onClick={() => setCreating(true)}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors text-sm text-gray-600"
                >
                  <Plus size={14} className="text-gray-400" />
                  Create organization
                </button>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}