// src/app/api/stripe/checkout/route.ts

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { priceId } = await req.json();
  if (!priceId)
    return NextResponse.json({ error: "Price ID required" }, { status: 400 });

  const membership = await prisma.membership.findFirst({
    where: { userId: session.user.id },
    include: { org: { include: { subscription: true } } },
  });

  if (!membership)
    return NextResponse.json({ error: "No organization" }, { status: 404 });

  const { org } = membership;
  let customerId = org.subscription?.stripeCustomerId;

  // Create Stripe customer if placeholder
  if (!customerId || customerId.startsWith("pending_")) {
    const customer = await stripe.customers.create({
      email: session.user.email!,
      name: org.name,
      metadata: { orgId: org.id },
    });
    customerId = customer.id;

    await prisma.subscription.upsert({
      where: { orgId: org.id },
      update: { stripeCustomerId: customerId },
      create: {
        orgId: org.id,
        stripeCustomerId: customerId,
        plan: "FREE",
        status: "TRIALING",
      },
    });
  }

  const checkoutSession = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: "subscription",
    payment_method_types: ["card"],
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${process.env.NEXTAUTH_URL}/dashboard/settings?success=true`,
    cancel_url: `${process.env.NEXTAUTH_URL}/dashboard/settings?canceled=true`,
    metadata: { orgId: org.id },
  });

  return NextResponse.json({ url: checkoutSession.url });
}