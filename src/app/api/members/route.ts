// src/app/api/members/route.ts

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getOrgIdFromSession } from "@/lib/api-helpers";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET() {
  const { orgId, error, status } = await getOrgIdFromSession();
  if (error || !orgId)
    return NextResponse.json({ error }, { status: status ?? 401 });

  const members = await prisma.membership.findMany({
    where: { orgId },
    include: { user: { select: { id: true, name: true, email: true, image: true } } },
    orderBy: { role: "asc" },
  });

  return NextResponse.json(members);
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { orgId, error, status } = await getOrgIdFromSession();
  if (error || !orgId)
    return NextResponse.json({ error }, { status: status ?? 401 });

  const { email, role } = await req.json();
  if (!email?.trim())
    return NextResponse.json({ error: "Email is required" }, { status: 400 });

  // Find user by email
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user)
    return NextResponse.json(
      { error: "No user found with that email. They must sign up first." },
      { status: 404 }
    );

  // Check if already a member
  const existing = await prisma.membership.findFirst({
    where: { orgId, userId: user.id },
  });
  if (existing)
    return NextResponse.json({ error: "Already a member" }, { status: 409 });

  const membership = await prisma.membership.create({
    data: { orgId, userId: user.id, role: role ?? "VIEWER" },
    include: { user: { select: { id: true, name: true, email: true, image: true } } },
  });

  return NextResponse.json(membership, { status: 201 });
}