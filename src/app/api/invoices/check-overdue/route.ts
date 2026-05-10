// src/app/api/invoices/check-overdue/route.ts

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// This route is called by a cron job or on page load
// It marks SENT invoices past their due date as OVERDUE
export async function POST(req: Request) {
  // Protect with a secret so only your cron can call it
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();

  const result = await prisma.invoice.updateMany({
    where: {
      status: "SENT",
      dueDate: { lt: now },
    },
    data: { status: "OVERDUE" },
  });

  console.log(`✅ Marked ${result.count} invoices as OVERDUE`);
  return NextResponse.json({ updated: result.count });
}

// Also expose GET so Vercel cron can call it
export async function GET(req: Request) {
  return POST(req);
}