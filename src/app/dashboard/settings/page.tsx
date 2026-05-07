// src/app/dashboard/settings/page.tsx

"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  Check, Zap, Building2, Loader2, Users, UserCircle,
  Settings, CreditCard, AlertTriangle, Trash2, Shield,
  Crown, Eye, ChevronDown,
} from "lucide-react";
import { config } from "@/lib/config";
import { signOut, useSession } from "next-auth/react";

const PRO_PRICE_ID = config.stripe.proPriceId;
const ENTERPRISE_PRICE_ID = config.stripe.enterprisePriceId;

// ─── Types ───────────────────────────────────────────────────────────────────

type Subscription = {
  plan: "FREE" | "PRO" | "ENTERPRISE";
  status: string;
  currentPeriodEnd: string | null;
};

type Member = {
  id: string;
  role: "OWNER" | "ACCOUNTANT" | "VIEWER";
  user: { id: string; name: string | null; email: string | null; image: string | null };
};

type Org = {
  id: string;
  name: string;
  currency: string;
};

// ─── Constants ───────────────────────────────────────────────────────────────

const TABS = [
  { id: "general",  label: "General",      icon: Settings    },
  { id: "profile",  label: "Profile",      icon: UserCircle  },
  { id: "members",  label: "Team",         icon: Users       },
  { id: "billing",  label: "Billing",      icon: CreditCard  },
  { id: "danger",   label: "Danger Zone",  icon: AlertTriangle },
];

const PLANS = [
  {
    id: "FREE", name: "Free", price: "$0", period: "forever", priceId: null,
    description: "For freelancers just getting started",
    features: ["Up to 5 invoices/month", "Up to 3 clients", "Basic PDF export", "Email support"],
  },
  {
    id: "PRO", name: "Pro", price: "$29", period: "per month", priceId: PRO_PRICE_ID,
    description: "For growing businesses", highlighted: true,
    features: ["Unlimited invoices", "Unlimited clients", "PDF export & branding", "Expense tracking", "Revenue charts", "Priority support"],
  },
  {
    id: "ENTERPRISE", name: "Enterprise", price: "$99", period: "per month", priceId: ENTERPRISE_PRICE_ID,
    description: "For teams and agencies",
    features: ["Everything in Pro", "Team members & roles", "AI cash flow forecast", "Custom branding", "Dedicated support", "SLA guarantee"],
  },
];

const CURRENCIES = ["USD", "EUR", "GBP", "BDT", "INR", "AUD", "CAD", "JPY", "SGD"];

const ROLE_ICONS = {
  OWNER:      { icon: Crown,  color: "text-yellow-600 bg-yellow-50"  },
  ACCOUNTANT: { icon: Shield, color: "text-blue-600 bg-blue-50"      },
  VIEWER:     { icon: Eye,    color: "text-gray-600 bg-gray-50"      },
};

const STATUS_STYLES: Record<string, string> = {
  ACTIVE:   "bg-green-100 text-green-700",
  TRIALING: "bg-blue-100 text-blue-700",
  PAST_DUE: "bg-red-100 text-red-600",
  CANCELED: "bg-gray-100 text-gray-500",
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function SectionHeader({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="mb-6">
      <h2 className="text-base font-semibold text-gray-900">{title}</h2>
      <p className="text-sm text-gray-500 mt-0.5">{desc}</p>
    </div>
  );
}

function SaveButton({ loading, label = "Save changes" }: { loading: boolean; label?: string }) {
  return (
    <button
      type="submit"
      disabled={loading}
      className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
    >
      {loading && <Loader2 size={14} className="animate-spin" />}
      {label}
    </button>
  );
}

// ─── Tab: General ─────────────────────────────────────────────────────────────

function GeneralTab() {
  const [org, setOrg] = useState<Org | null>(null);
  const [name, setName] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch("/api/orgs")
      .then((r) => r.json())
      .then((orgs) => {
        if (orgs?.[0]) {
          setOrg(orgs[0]);
          setName(orgs[0].name);
          setCurrency(orgs[0].currency ?? "USD");
        }
      });
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!org) return;
    setSaving(true);
    await fetch(`/api/orgs/${org.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, currency }),
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div>
      <SectionHeader title="General Settings" desc="Update your organization name and preferences." />
      <form onSubmit={handleSubmit} className="space-y-5 max-w-lg">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Organization name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Currency
          </label>
          <select
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {CURRENCIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-3">
          <SaveButton loading={saving} />
          {saved && (
            <span className="flex items-center gap-1 text-sm text-green-600">
              <Check size={14} /> Saved
            </span>
          )}
        </div>
      </form>
    </div>
  );
}

// ─── Tab: Profile ─────────────────────────────────────────────────────────────

function ProfileTab() {
  const { data: session, update } = useSession();
  const [name, setName] = useState(session?.user?.name ?? "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    await fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    await update({ name });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  const initials = name
    ? name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : "?";

  return (
    <div>
      <SectionHeader title="Profile" desc="Update your personal information." />
      <div className="max-w-lg space-y-6">
        {/* Avatar */}
        <div className="flex items-center gap-4">
          {session?.user?.image ? (
            <img
              src={session.user.image}
              alt="avatar"
              className="w-16 h-16 rounded-full object-cover border-2 border-gray-200"
            />
          ) : (
            <div className="w-16 h-16 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xl font-semibold border-2 border-gray-200">
              {initials}
            </div>
          )}
          <div>
            <p className="text-sm font-medium text-gray-900">{session?.user?.name}</p>
            <p className="text-xs text-gray-400">{session?.user?.email}</p>
            <p className="text-xs text-gray-400 mt-1">
              Avatar synced from Google
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Full name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              value={session?.user?.email ?? ""}
              disabled
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-gray-50 text-gray-400 cursor-not-allowed"
            />
            <p className="text-xs text-gray-400 mt-1">
              Email is managed by Google and cannot be changed here.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <SaveButton loading={saving} />
            {saved && (
              <span className="flex items-center gap-1 text-sm text-green-600">
                <Check size={14} /> Saved
              </span>
            )}
          </div>
        </form>

        {/* Sign out */}
        <div className="pt-4 border-t border-gray-100">
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="text-sm text-red-600 hover:text-red-700 font-medium"
          >
            Sign out of your account
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Tab: Members ─────────────────────────────────────────────────────────────

function MembersTab() {
  const { data: session } = useSession();
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"ACCOUNTANT" | "VIEWER">("VIEWER");
  const [inviting, setInviting] = useState(false);
  const [error, setError] = useState("");

  async function fetchMembers() {
    const res = await fetch("/api/members");
    const data = await res.json();
    setMembers(data);
    setLoading(false);
  }

  useEffect(() => { fetchMembers(); }, []);

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    setInviting(true);
    setError("");
    const res = await fetch("/api/members", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, role }),
    });
    if (res.ok) {
      setEmail("");
      await fetchMembers();
    } else {
      const data = await res.json();
      setError(data.error);
    }
    setInviting(false);
  }

  async function handleRoleChange(memberId: string, newRole: string) {
    await fetch(`/api/members/${memberId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role: newRole }),
    });
    await fetchMembers();
  }

  async function handleRemove(memberId: string) {
    if (!confirm("Remove this member?")) return;
    await fetch(`/api/members/${memberId}`, { method: "DELETE" });
    await fetchMembers();
  }

  return (
    <div>
      <SectionHeader title="Team Members" desc="Manage who has access to your organization." />

      {/* Invite form */}
      <div className="bg-gray-50 border border-gray-200 rounded-xl p-5 mb-6 max-w-lg">
        <p className="text-sm font-medium text-gray-700 mb-3">Add a team member</p>
        <form onSubmit={handleInvite} className="space-y-3">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="colleague@company.com"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
          <div className="flex gap-3">
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as any)}
              className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="VIEWER">Viewer — read only</option>
              <option value="ACCOUNTANT">Accountant — create & edit</option>
            </select>
            <button
              type="submit"
              disabled={inviting}
              className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
            >
              {inviting && <Loader2 size={13} className="animate-spin" />}
              Add
            </button>
          </div>
          {error && <p className="text-xs text-red-600">{error}</p>}
          <p className="text-xs text-gray-400">
            The person must already have a FinFlow account.
          </p>
        </form>
      </div>

      {/* Members list */}
      {loading ? (
        <div className="text-sm text-gray-400">Loading...</div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden max-w-2xl">
          {members.map((member, i) => {
            const roleStyle = ROLE_ICONS[member.role];
            const RoleIcon = roleStyle.icon;
            const isCurrentUser = member.user.email === session?.user?.email;
            const initials = member.user.name
              ? member.user.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
              : "?";

            return (
              <div
                key={member.id}
                className={`flex items-center gap-4 px-5 py-4 ${
                  i !== members.length - 1 ? "border-b border-gray-100" : ""
                }`}
              >
                {/* Avatar */}
                {member.user.image ? (
                  <img
                    src={member.user.image}
                    alt=""
                    className="w-9 h-9 rounded-full object-cover flex-shrink-0"
                  />
                ) : (
                  <div className="w-9 h-9 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-semibold flex-shrink-0">
                    {initials}
                  </div>
                )}

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {member.user.name ?? "Unknown"}
                    </p>
                    {isCurrentUser && (
                      <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
                        You
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-400 truncate">{member.user.email}</p>
                </div>

                {/* Role badge */}
                <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${roleStyle.color}`}>
                  <RoleIcon size={12} />
                  {member.role}
                </div>

                {/* Actions — only for non-owners */}
                {member.role !== "OWNER" && !isCurrentUser && (
                  <div className="flex items-center gap-2">
                    <div className="relative group">
                      <button className="flex items-center gap-1 text-xs text-gray-500 border border-gray-200 rounded-lg px-2.5 py-1.5 hover:bg-gray-50">
                        Change role <ChevronDown size={11} />
                      </button>
                      <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10 hidden group-hover:block min-w-[140px]">
                        {["ACCOUNTANT", "VIEWER"].map((r) => (
                          <button
                            key={r}
                            onClick={() => handleRoleChange(member.id, r)}
                            className={`block w-full text-left px-3 py-2 text-xs hover:bg-gray-50 first:rounded-t-lg last:rounded-b-lg ${
                              member.role === r ? "text-blue-600 font-medium" : "text-gray-700"
                            }`}
                          >
                            {r === "ACCOUNTANT" ? "Accountant" : "Viewer"}
                          </button>
                        ))}
                      </div>
                    </div>
                    <button
                      onClick={() => handleRemove(member.id)}
                      className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Tab: Billing ─────────────────────────────────────────────────────────────

function BillingTab({ initialBanner }: { initialBanner: "success" | "canceled" | null }) {
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);
  const [portalLoading, setPortalLoading] = useState(false);
  const [banner, setBanner] = useState(initialBanner);

  useEffect(() => {
    fetch("/api/stripe/subscription")
      .then((r) => r.json())
      .then((d) => { setSubscription(d); setLoading(false); });
  }, []);

  async function handleUpgrade(priceId: string, planId: string) {
    setCheckoutLoading(planId);
    const res = await fetch("/api/stripe/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ priceId }),
    });
    const data = await res.json();
    if (data.url) window.location.href = data.url;
    else setCheckoutLoading(null);
  }

  async function handlePortal() {
    setPortalLoading(true);
    const res = await fetch("/api/stripe/portal", { method: "POST" });
    const data = await res.json();
    if (data.url) window.location.href = data.url;
    else setPortalLoading(false);
  }

  return (
    <div>
      <SectionHeader title="Billing & Plan" desc="Manage your subscription and payment details." />

      {banner === "success" && (
        <div className="mb-6 flex items-center gap-3 bg-green-50 border border-green-200 text-green-800 rounded-xl px-5 py-4 text-sm">
          <Check size={16} className="text-green-600 shrink-0" />
          <span><strong>Subscription activated!</strong> Your plan has been upgraded.</span>
        </div>
      )}
      {banner === "canceled" && (
        <div className="mb-6 bg-yellow-50 border border-yellow-200 text-yellow-800 rounded-xl px-5 py-4 text-sm">
          Checkout was canceled. Your plan has not changed.
        </div>
      )}

      {/* Current plan */}
      {!loading && subscription && (
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm mb-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <p className="text-xs text-gray-500 mb-1">Current plan</p>
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold text-gray-900">{subscription.plan}</span>
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${STATUS_STYLES[subscription.status] ?? STATUS_STYLES.TRIALING}`}>
                  {subscription.status}
                </span>
              </div>
              {subscription.currentPeriodEnd && (
                <p className="text-xs text-gray-400 mt-1">
                  Renews {new Date(subscription.currentPeriodEnd).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
                </p>
              )}
            </div>
            {subscription.plan !== "FREE" && (
              <button
                onClick={handlePortal}
                disabled={portalLoading}
                className="flex items-center gap-2 border border-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 disabled:opacity-50"
              >
                {portalLoading && <Loader2 size={13} className="animate-spin" />}
                Manage billing
              </button>
            )}
          </div>
        </div>
      )}

      {/* Plans */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {PLANS.map((plan) => {
          const isCurrent = subscription?.plan === plan.id;
          return (
            <div
              key={plan.id}
              className={`relative bg-white rounded-2xl p-5 flex flex-col ${
                plan.highlighted ? "border-2 border-blue-500 shadow-lg" : "border border-gray-200 shadow-sm"
              }`}
            >
              {plan.highlighted && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="bg-blue-500 text-white text-xs font-semibold px-3 py-1 rounded-full">
                    Most popular
                  </span>
                </div>
              )}
              <div className="mb-4">
                <div className="flex items-center gap-2 mb-1">
                  {plan.id === "PRO" && <Zap size={14} className="text-blue-500" />}
                  {plan.id === "ENTERPRISE" && <Building2 size={14} className="text-purple-500" />}
                  <h3 className="font-semibold text-gray-900">{plan.name}</h3>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-bold text-gray-900">{plan.price}</span>
                  <span className="text-xs text-gray-400">{plan.period}</span>
                </div>
              </div>
              <ul className="space-y-2 mb-4 flex-1">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-xs text-gray-600">
                    <Check size={12} className="text-green-500 shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              {isCurrent ? (
                <div className="w-full text-center py-2 rounded-lg bg-gray-100 text-xs font-medium text-gray-500">
                  Current plan
                </div>
              ) : plan.priceId ? (
                <button
                  onClick={() => handleUpgrade(plan.priceId!, plan.id)}
                  disabled={checkoutLoading === plan.id}
                  className={`w-full flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-medium disabled:opacity-50 ${
                    plan.highlighted ? "bg-blue-600 text-white hover:bg-blue-700" : "bg-gray-900 text-white hover:bg-gray-800"
                  }`}
                >
                  {checkoutLoading === plan.id && <Loader2 size={12} className="animate-spin" />}
                  Upgrade to {plan.name}
                </button>
              ) : (
                <div className="w-full text-center py-2 rounded-lg border border-gray-200 text-xs font-medium text-gray-400">
                  Free forever
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Tab: Danger Zone ─────────────────────────────────────────────────────────

function DangerTab() {
  const router = useRouter();
  const [confirmName, setConfirmName] = useState("");
  const [orgName, setOrgName] = useState("");
  const [orgId, setOrgId] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/orgs")
      .then((r) => r.json())
      .then((orgs) => {
        if (orgs?.[0]) {
          setOrgName(orgs[0].name);
          setOrgId(orgs[0].id);
        }
      });
  }, []);

  async function handleDelete(e: React.FormEvent) {
    e.preventDefault();
    if (confirmName !== orgName) {
      setError("Organization name does not match.");
      return;
    }
    setDeleting(true);
    const res = await fetch(`/api/orgs/${orgId}`, { method: "DELETE" });
    if (res.ok) {
      await signOut({ callbackUrl: "/login" });
    } else {
      const data = await res.json();
      setError(data.error);
      setDeleting(false);
    }
  }

  return (
    <div>
      <SectionHeader
        title="Danger Zone"
        desc="Irreversible actions that affect your organization."
      />

      <div className="border border-red-200 rounded-xl overflow-hidden max-w-lg">
        <div className="px-5 py-4 bg-red-50 border-b border-red-200">
          <div className="flex items-center gap-2">
            <AlertTriangle size={15} className="text-red-600" />
            <h3 className="text-sm font-semibold text-red-800">
              Delete organization
            </h3>
          </div>
          <p className="text-xs text-red-600 mt-1">
            This will permanently delete <strong>{orgName}</strong> and all its data —
            invoices, clients, expenses, and reports. This cannot be undone.
          </p>
        </div>

        <div className="p-5 bg-white">
          <form onSubmit={handleDelete} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Type <span className="font-semibold text-gray-900">{orgName}</span> to confirm
              </label>
              <input
                type="text"
                value={confirmName}
                onChange={(e) => { setConfirmName(e.target.value); setError(""); }}
                placeholder={orgName}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>
            {error && <p className="text-xs text-red-600">{error}</p>}
            <button
              type="submit"
              disabled={confirmName !== orgName || deleting}
              className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              {deleting && <Loader2 size={14} className="animate-spin" />}
              <Trash2 size={14} />
              Delete organization permanently
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function SettingsPage() {
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState("general");

  const banner = searchParams.get("success")
    ? "success"
    : searchParams.get("canceled")
    ? "canceled"
    : null;

  // Auto-switch to billing tab if redirected from Stripe
  useEffect(() => {
    if (banner) setActiveTab("billing");
  }, [banner]);

  return (
    <div className="max-w-5xl mx-auto pb-12">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Manage your organization, profile, team and billing.
        </p>
      </div>

      <div className="flex gap-8">
        {/* Sidebar tabs */}
        <aside className="w-48 flex-shrink-0">
          <nav className="space-y-1">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors text-left ${
                    isActive
                      ? "bg-blue-50 text-blue-700"
                      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                  } ${tab.id === "danger" ? "mt-4 text-red-600 hover:bg-red-50 hover:text-red-700" : ""}`}
                >
                  <Icon size={16} className={isActive ? "text-blue-600" : tab.id === "danger" ? "text-red-500" : "text-gray-400"} />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </aside>

        {/* Tab content */}
        <div className="flex-1 min-w-0">
          {activeTab === "general"  && <GeneralTab />}
          {activeTab === "profile"  && <ProfileTab />}
          {activeTab === "members"  && <MembersTab />}
          {activeTab === "billing"  && <BillingTab initialBanner={banner as any} />}
          {activeTab === "danger"   && <DangerTab />}
        </div>
      </div>
    </div>
  );
}