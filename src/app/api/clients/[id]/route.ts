// src/app/api/clients/[id]/route.ts

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

// PATCH /api/clients/[id] — update a client
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const orgId = await getOrgId(session.user.id);
  const { id } = await params;

  const existing = await prisma.client.findFirst({
    where: { id, orgId },
  });

  if (!existing)
    return NextResponse.json({ error: "Client not found" }, { status: 404 });

  const { name, email, address } = await req.json();

  const updated = await prisma.client.update({
    where: { id },
    data: { name, email, address },
  });

  return NextResponse.json(updated);
}

// DELETE /api/clients/[id] — delete a client
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const orgId = await getOrgId(session.user.id);
  const { id } = await params;

  const existing = await prisma.client.findFirst({
    where: { id, orgId },
  });

  if (!existing)
    return NextResponse.json({ error: "Client not found" }, { status: 404 });

  await prisma.client.delete({ where: { id } });

  return NextResponse.json({ success: true });
}