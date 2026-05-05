// src/app/api/stripe/portal/route.ts

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";

export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const membership = await prisma.membership.findFirst({
    where: { userId: session.user.id },
    include: { org: { include: { subscription: true } } },
  });

  if (!membership?.org.subscription?.stripeCustomerId)
    return NextResponse.json({ error: "No subscription found" }, { status: 404 });

  const { stripeCustomerId } = membership.org.subscription;

  if (stripeCustomerId.startsWith("pending_"))
    return NextResponse.json(
      { error: "No active subscription to manage" },
      { status: 400 }
    );

  const portalSession = await stripe.billingPortal.sessions.create({
    customer: stripeCustomerId,
    return_url: `${process.env.NEXTAUTH_URL}/dashboard/settings`,
  });

  return NextResponse.json({ url: portalSession.url });
}