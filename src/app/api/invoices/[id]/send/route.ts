// src/app/api/invoices/[id]/send/route.ts

import { NextResponse } from "next/server";
import { getOrgIdFromSession } from "@/lib/api-helpers";
import { prisma } from "@/lib/prisma";
import { Resend } from "resend";
import { renderToBuffer } from "@react-pdf/renderer";
import React from "react";
import InvoicePDF from "@/components/InvoicePDF";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { orgId, error, status } = await getOrgIdFromSession();
  if (error || !orgId)
    return NextResponse.json({ error }, { status: status ?? 401 });

  const { id } = await params;

  const invoice = await prisma.invoice.findFirst({
    where: { id, orgId },
    include: {
      client: true,
      items: true,
      org: true,
    },
  });

  if (!invoice)
    return NextResponse.json({ error: "Invoice not found" }, { status: 404 });

  if (!invoice.client.email)
    return NextResponse.json({ error: "Client has no email" }, { status: 400 });

  // Generate PDF buffer
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
      orgName: invoice.org.name,
    }) as React.ReactElement<any>
  );

  const dueDate = new Date(invoice.dueDate).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  // Send email with PDF attachment
  const { error: sendError } = await resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL ?? "onboarding@resend.dev",
    to: invoice.client.email,
    subject: `Invoice ${invoice.number} from ${invoice.org.name}`,
    html: `
      <div style="font-family: -apple-system, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px; color: #111827;">
        <div style="margin-bottom: 32px;">
          <h1 style="font-size: 24px; font-weight: 700; color: #2563EB; margin: 0 0 4px;">
            ${invoice.org.name}
          </h1>
        </div>

        <p style="font-size: 16px; color: #374151; margin-bottom: 8px;">
          Hi ${invoice.client.name},
        </p>
        <p style="font-size: 15px; color: #6B7280; margin-bottom: 32px; line-height: 1.6;">
          Please find attached invoice <strong style="color: #111827;">${invoice.number}</strong>
          for <strong style="color: #111827;">$${Number(invoice.total).toFixed(2)}</strong>,
          due on <strong style="color: #111827;">${dueDate}</strong>.
        </p>

        <div style="background: #F9FAFB; border: 1px solid #E5E7EB; border-radius: 12px; padding: 24px; margin-bottom: 32px;">
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 6px 0; font-size: 13px; color: #6B7280;">Invoice number</td>
              <td style="padding: 6px 0; font-size: 13px; font-weight: 600; color: #111827; text-align: right;">${invoice.number}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; font-size: 13px; color: #6B7280;">Amount due</td>
              <td style="padding: 6px 0; font-size: 13px; font-weight: 600; color: #111827; text-align: right;">$${Number(invoice.total).toFixed(2)}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; font-size: 13px; color: #6B7280;">Due date</td>
              <td style="padding: 6px 0; font-size: 13px; font-weight: 600; color: #111827; text-align: right;">${dueDate}</td>
            </tr>
          </table>
        </div>

        ${invoice.notes ? `
        <div style="background: #EFF6FF; border-left: 3px solid #2563EB; padding: 12px 16px; border-radius: 0 8px 8px 0; margin-bottom: 32px;">
          <p style="font-size: 13px; color: #1D4ED8; margin: 0;">${invoice.notes}</p>
        </div>
        ` : ""}

        <p style="font-size: 13px; color: #9CA3AF; border-top: 1px solid #E5E7EB; padding-top: 24px; margin: 0;">
          This invoice was sent by ${invoice.org.name} via FinFlow.
          The PDF is attached to this email.
        </p>
      </div>
    `,
    attachments: [
      {
        filename: `${invoice.number}.pdf`,
        content: Buffer.from(buffer).toString("base64"),
      },
    ],
  });

  if (sendError) {
    console.error("Resend error:", sendError);
    return NextResponse.json({ error: "Failed to send email" }, { status: 500 });
  }

  // Mark invoice as SENT after emailing
  await prisma.invoice.update({
    where: { id },
    data: { status: "SENT" },
  });

  return NextResponse.json({ success: true });
}