// src/app/api/invoices/[id]/route.ts

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { InvoiceStatus } from "@prisma/client";

async function getOrgId(userId: string) {
  const membership = await prisma.membership.findFirst({
    where: { userId },
    select: { orgId: true },
  });
  return membership?.orgId;
}

// PATCH /api/invoices/[id] — update status
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const orgId = await getOrgId(session.user.id);
  const { id } = await params;
  const { status } = await req.json();

  const existing = await prisma.invoice.findFirst({ where: { id, orgId } });
  if (!existing)
    return NextResponse.json({ error: "Invoice not found" }, { status: 404 });

  const updated = await prisma.invoice.update({
    where: { id },
    data: { status: status as InvoiceStatus },
    include: {
      client: { select: { name: true, email: true } },
      items: true,
    },
  });

  return NextResponse.json(updated);
}

// DELETE /api/invoices/[id]
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const orgId = await getOrgId(session.user.id);
  const { id } = await params;

  const existing = await prisma.invoice.findFirst({ where: { id, orgId } });
  if (!existing)
    return NextResponse.json({ error: "Invoice not found" }, { status: 404 });

  await prisma.invoice.delete({ where: { id } });

  return NextResponse.json({ success: true });
}