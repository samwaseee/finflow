// src/app/api/stripe/webhook/route.ts

import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import type Stripe from "stripe";

function getPeriodEnd(subscription: Stripe.Subscription): Date | null {
  const ts = (subscription as any).current_period_end;
  return ts ? new Date(ts * 1000) : null;
}

export async function POST(req: Request) {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature")!;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!,
    );
  } catch (err) {
    console.error("Webhook signature failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const PRICE_TO_PLAN: Record<string, "FREE" | "PRO" | "ENTERPRISE"> = {
    [process.env.STRIPE_PRO_PRICE_ID!]: "PRO",
    [process.env.STRIPE_ENTERPRISE_PRICE_ID!]: "ENTERPRISE",
  };

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const orgId = session.metadata?.orgId;

      if (!orgId) break;

      const stripeSub = await stripe.subscriptions.retrieve(
        session.subscription as string,
      );
      const priceId = stripeSub.items.data[0].price.id;

      await prisma.subscription.update({
        where: { orgId },
        data: {
          stripePriceId: priceId,
          plan: PRICE_TO_PLAN[priceId] ?? "FREE",
          status: "ACTIVE",
          currentPeriodEnd: getPeriodEnd(stripeSub),
        },
      });
      break;
    }

    case "invoice.payment_succeeded": {
      const invoice = event.data.object as Stripe.Invoice;
      const customerId = invoice.customer as string;

      const sub = await prisma.subscription.findUnique({
        where: { stripeCustomerId: customerId },
      });
      if (!sub) break;

      const stripeSub = await stripe.subscriptions.retrieve(
        // @ts-ignore
        invoice.subscription as string,
      );
      const priceId = stripeSub.items.data[0].price.id;

      await prisma.subscription.update({
        where: { stripeCustomerId: customerId },
        data: {
          status: "ACTIVE",
          plan: PRICE_TO_PLAN[priceId] ?? "FREE",
          currentPeriodEnd: getPeriodEnd(stripeSub),
        },
      });
      break;
    }

    case "invoice.payment_failed": {
      const invoice = event.data.object as Stripe.Invoice;
      const customerId = invoice.customer as string;

      await prisma.subscription.updateMany({
        where: { stripeCustomerId: customerId },
        data: { status: "PAST_DUE" },
      });
      break;
    }

    case "customer.subscription.deleted": {
      const subscription = event.data.object as Stripe.Subscription;
      const customerId = subscription.customer as string;

      await prisma.subscription.updateMany({
        where: { stripeCustomerId: customerId },
        data: { status: "CANCELED", plan: "FREE" },
      });
      break;
    }

    case "customer.subscription.updated": {
      const subscription = event.data.object as Stripe.Subscription;
      const customerId = subscription.customer as string;
      const priceId = subscription.items.data[0].price.id;

      await prisma.subscription.updateMany({
        where: { stripeCustomerId: customerId },
        data: {
          stripePriceId: priceId,
          plan: PRICE_TO_PLAN[priceId] ?? "FREE",
          status: subscription.status === "active" ? "ACTIVE" : "PAST_DUE",
          currentPeriodEnd: getPeriodEnd(subscription),
        },
      });
      break;
    }
  }

  return NextResponse.json({ received: true });
}
