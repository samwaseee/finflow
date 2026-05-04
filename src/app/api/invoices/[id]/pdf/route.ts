// src/app/api/invoices/[id]/pdf/route.ts

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { renderToBuffer } from "@react-pdf/renderer";
import React from "react";
import InvoicePDF from "@/components/InvoicePDF";

async function getOrgId(userId: string) {
  const membership = await prisma.membership.findFirst({
    where: { userId },
    include: { org: true },
  });
  return membership;
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const membership = await getOrgId(session.user.id);
  if (!membership)
    return NextResponse.json({ error: "No organization" }, { status: 404 });

  const { id } = await params;

  const invoice = await prisma.invoice.findFirst({
    where: { id, orgId: membership.orgId },
    include: {
      client: true,
      items: true,
    },
  });

  if (!invoice)
    return NextResponse.json({ error: "Invoice not found" }, { status: 404 });

  const buffer = await renderToBuffer(
    React.createElement(InvoicePDF, {
      invoice: {
        number: invoice.number,
        status: invoice.status,
        dueDate: invoice.dueDate.toISOString(),
        createdAt: invoice.createdAt.toISOString(),
        total: Number(invoice.total),
        notes: invoice.notes,
        items: invoice.items.map((item) => ({
          description: item.description,
          quantity: item.quantity,
          unitPrice: Number(item.unitPrice),
        })),
        client: {
          name: invoice.client.name,
          email: invoice.client.email,
          address: invoice.client.address,
        },
      },
      orgName: membership.org.name,
    }) as React.ReactElement<any>,
  );

  return new NextResponse(new Uint8Array(buffer), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${invoice.number}.pdf"`,
    },
  });
}
