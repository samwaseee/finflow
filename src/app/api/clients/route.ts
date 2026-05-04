// src/app/api/clients/route.ts

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function getOrgId(userId: string) {
  const membership = await prisma.membership.findFirst({
    where: { userId },
    select: { orgId: true },
  });
  return membership?.orgId;
}

// GET /api/clients — list all clients for the org
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const orgId = await getOrgId(session.user.id);
  if (!orgId)
    return NextResponse.json({ error: "No organization found" }, { status: 404 });

  const clients = await prisma.client.findMany({
    where: { orgId },
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { invoices: true } },
    },
  });

  return NextResponse.json(clients);
}

// POST /api/clients — create a new client
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const orgId = await getOrgId(session.user.id);
  if (!orgId)
    return NextResponse.json({ error: "No organization found" }, { status: 404 });

  const { name, email, address } = await req.json();

  if (!name?.trim() || !email?.trim())
    return NextResponse.json(
      { error: "Name and email are required" },
      { status: 400 }
    );

  const client = await prisma.client.create({
    data: { orgId, name, email, address },
  });

  return NextResponse.json(client, { status: 201 });
}