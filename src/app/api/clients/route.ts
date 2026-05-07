// src/app/api/clients/route.ts

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getOrgIdFromSession } from "@/lib/api-helpers";

export async function GET() {
  const { orgId, error, status } = await getOrgIdFromSession();
  if (error) return NextResponse.json({ error }, { status: status ?? 401 });

  const clients = await prisma.client.findMany({
    where: { orgId: orgId! },
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { invoices: true } } },
  });

  return NextResponse.json(clients);
}

export async function POST(req: Request) {
  const { orgId, error, status } = await getOrgIdFromSession();
  if (error) return NextResponse.json({ error }, { status: status ?? 401 });

  const { name, email, address } = await req.json();
  if (!name?.trim() || !email?.trim())
    return NextResponse.json({ error: "Name and email are required" }, { status: 400 });

  const client = await prisma.client.create({
    data: { orgId: orgId!, name, email, address },
  });

  return NextResponse.json(client, { status: 201 });
}