// src/app/api/invoices/[id]/route.ts

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { InvoiceStatus } from "@prisma/client";
import { getOrgIdFromSession } from "@/lib/api-helpers";

// PATCH /api/invoices/[id] — update status OR full edit
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { orgId, error, status } = await getOrgIdFromSession();
  if (error || !orgId)
    return NextResponse.json({ error }, { status: status ?? 401 });

  const { id } = await params;
  const body = await req.json();

  const existing = await prisma.invoice.findFirst({ where: { id, orgId } });
  if (!existing)
    return NextResponse.json({ error: "Invoice not found" }, { status: 404 });

  // Status-only update
  if (body.status && !body.items) {
    const updated = await prisma.invoice.update({
      where: { id },
      data: { status: body.status as InvoiceStatus },
      include: {
        client: { select: { name: true, email: true } },
        items: true,
      },
    });
    return NextResponse.json(updated);
  }

  // Full edit — recalculate total and replace items
  const { clientId, dueDate, notes, items } = body;

  if (!items?.length)
    return NextResponse.json({ error: "At least one item required" }, { status: 400 });

  const total = items.reduce(
    (sum: number, item: { quantity: number; unitPrice: number }) =>
      sum + item.quantity * item.unitPrice,
    0
  );

  // Delete old items and recreate
  await prisma.invoiceItem.deleteMany({ where: { invoiceId: id } });

  const updated = await prisma.invoice.update({
    where: { id },
    data: {
      clientId,
      dueDate: new Date(dueDate),
      notes,
      total,
      items: {
        create: items.map((item: { description: string; quantity: number; unitPrice: number }) => ({
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
        })),
      },
    },
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
  const { orgId, error, status } = await getOrgIdFromSession();
  if (error || !orgId)
    return NextResponse.json({ error }, { status: status ?? 401 });

  const { id } = await params;

  const existing = await prisma.invoice.findFirst({ where: { id, orgId } });
  if (!existing)
    return NextResponse.json({ error: "Invoice not found" }, { status: 404 });

  await prisma.invoice.delete({ where: { id } });
  return NextResponse.json({ success: true });
}