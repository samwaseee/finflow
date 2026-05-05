// src/app/dashboard/settings/page.tsx

"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Check, Zap, Building2, Loader2 } from "lucide-react";
import { config } from "@/lib/config";

const PRO_PRICE_ID = config.stripe.proPriceId;
const ENTERPRISE_PRICE_ID = config.stripe.enterprisePriceId;

type Subscription = {
  plan: "FREE" | "PRO" | "ENTERPRISE";
  status: string;
  currentPeriodEnd: string | null;
};

const PLANS = [
  {
    id: "FREE",
    name: "Free",
    price: "$0",
    period: "forever",
    priceId: null,
    description: "For freelancers just getting started",
    features: [
      "Up to 5 invoices/month",
      "Up to 3 clients",
      "Basic PDF export",
      "Email support",
    ],
  },
  {
    id: "PRO",
    name: "Pro",
    price: "$29",
    period: "per month",
    priceId: PRO_PRICE_ID,
    description: "For growing businesses",
    features: [
      "Unlimited invoices",
      "Unlimited clients",
      "PDF export & branding",
      "Expense tracking",
      "Revenue charts",
      "Priority support",
    ],
    highlighted: true,
  },
  {
    id: "ENTERPRISE",
    name: "Enterprise",
    price: "$99",
    period: "per month",
    priceId: ENTERPRISE_PRICE_ID,
    description: "For teams and agencies",
    features: [
      "Everything in Pro",
      "Team members & roles",
      "AI cash flow forecast",
      "Custom branding",
      "Dedicated support",
      "SLA guarantee",
    ],
  },
];

const STATUS_STYLES: Record<string, string> = {
  ACTIVE:   "bg-green-100 text-green-700",
  TRIALING: "bg-blue-100 text-blue-700",
  PAST_DUE: "bg-red-100 text-red-600",
  CANCELED: "bg-gray-100 text-gray-500",
};

export default function SettingsPage() {
  const searchParams = useSearchParams();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);
  const [portalLoading, setPortalLoading] = useState(false);
  const [banner, setBanner] = useState<"success" | "canceled" | null>(null);

  useEffect(() => {
    if (searchParams.get("success")) setBanner("success");
    if (searchParams.get("canceled")) setBanner("canceled");

    fetch("/api/stripe/subscription")
      .then((r) => r.json())
      .then((d) => {
        setSubscription(d);
        setLoading(false);
      });
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
    <div className="max-w-5xl mx-auto pb-12">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-sm text-gray-500 mt-1">Manage your plan and billing.</p>
      </div>

      {/* Banners */}
      {banner === "success" && (
        <div className="mb-6 flex items-center gap-3 bg-green-50 border border-green-200 text-green-800 rounded-xl px-5 py-4 text-sm">
          <Check size={16} className="text-green-600 shrink-0" />
          <span>
            <strong>Subscription activated!</strong> Your plan has been upgraded successfully.
          </span>
        </div>
      )}
      {banner === "canceled" && (
        <div className="mb-6 bg-yellow-50 border border-yellow-200 text-yellow-800 rounded-xl px-5 py-4 text-sm">
          Checkout was canceled. Your plan has not changed.
        </div>
      )}

      {/* Current plan status */}
      {!loading && subscription && (
        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm mb-8">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <p className="text-sm text-gray-500 mb-1">Current plan</p>
              <div className="flex items-center gap-3">
                <span className="text-xl font-bold text-gray-900">
                  {subscription.plan}
                </span>
                <span
                  className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                    STATUS_STYLES[subscription.status] ?? STATUS_STYLES.TRIALING
                  }`}
                >
                  {subscription.status}
                </span>
              </div>
              {subscription.currentPeriodEnd && (
                <p className="text-xs text-gray-400 mt-1">
                  Renews{" "}
                  {new Date(subscription.currentPeriodEnd).toLocaleDateString(
                    "en-US",
                    { year: "numeric", month: "long", day: "numeric" }
                  )}
                </p>
              )}
            </div>
            {subscription.plan !== "FREE" && (
              <button
                onClick={handlePortal}
                disabled={portalLoading}
                className="flex items-center gap-2 border border-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                {portalLoading && <Loader2 size={14} className="animate-spin" />}
                Manage billing
              </button>
            )}
          </div>
        </div>
      )}

      {/* Pricing cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {PLANS.map((plan) => {
          const isCurrent = subscription?.plan === plan.id;
          const isHighlighted = plan.highlighted;

          return (
            <div
              key={plan.id}
              className={`relative bg-white rounded-2xl p-6 flex flex-col ${
                isHighlighted
                  ? "border-2 border-blue-500 shadow-lg"
                  : "border border-gray-200 shadow-sm"
              }`}
            >
              {isHighlighted && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="bg-blue-500 text-white text-xs font-semibold px-3 py-1 rounded-full">
                    Most popular
                  </span>
                </div>
              )}

              <div className="mb-5">
                <div className="flex items-center gap-2 mb-2">
                  {plan.id === "PRO" && <Zap size={16} className="text-blue-500" />}
                  {plan.id === "ENTERPRISE" && <Building2 size={16} className="text-purple-500" />}
                  <h3 className="font-semibold text-gray-900">{plan.name}</h3>
                </div>
                <div className="flex items-baseline gap-1 mb-1">
                  <span className="text-3xl font-bold text-gray-900">{plan.price}</span>
                  <span className="text-sm text-gray-400">{plan.period}</span>
                </div>
                <p className="text-xs text-gray-500">{plan.description}</p>
              </div>

              <ul className="space-y-2.5 mb-6 flex-1">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-center gap-2 text-sm text-gray-600">
                    <Check size={14} className="text-green-500 shrink-0" />
                    {feature}
                  </li>
                ))}
              </ul>

              {isCurrent ? (
                <div className="w-full text-center py-2.5 rounded-lg bg-gray-100 text-sm font-medium text-gray-500">
                  Current plan
                </div>
              ) : plan.priceId ? (
                <button
                  onClick={() => handleUpgrade(plan.priceId!, plan.id)}
                  disabled={checkoutLoading === plan.id}
                  className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 ${
                    isHighlighted
                      ? "bg-blue-600 text-white hover:bg-blue-700"
                      : "bg-gray-900 text-white hover:bg-gray-800"
                  }`}
                >
                  {checkoutLoading === plan.id && (
                    <Loader2 size={14} className="animate-spin" />
                  )}
                  Upgrade to {plan.name}
                </button>
              ) : (
                <div className="w-full text-center py-2.5 rounded-lg border border-gray-200 text-sm font-medium text-gray-400">
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