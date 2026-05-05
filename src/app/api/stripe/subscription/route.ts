// src/app/api/stripe/subscription/route.ts

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const membership = await prisma.membership.findFirst({
    where: { userId: session.user.id },
    include: { org: { include: { subscription: true } } },
  });

  if (!membership?.org.subscription)
    return NextResponse.json({ plan: "FREE", status: "TRIALING", currentPeriodEnd: null });

  const { plan, status, currentPeriodEnd } = membership.org.subscription;

  return NextResponse.json({ plan, status, currentPeriodEnd });
}