// src/app/api/orgs/[id]/route.ts

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getOrgIdFromSession } from "@/lib/api-helpers";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { orgId, error, status } = await getOrgIdFromSession();
  if (error || !orgId)
    return NextResponse.json({ error }, { status: status ?? 401 });

  const { id } = await params;
  if (id !== orgId)
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { name, currency } = await req.json();

  const org = await prisma.organization.update({
    where: { id: orgId },
    data: { name, currency },
  });

  return NextResponse.json(org);
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { orgId, error, status } = await getOrgIdFromSession();
  if (error || !orgId)
    return NextResponse.json({ error }, { status: status ?? 401 });

  const { id } = await params;
  if (id !== orgId)
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  // Only owner can delete
  const membership = await prisma.membership.findFirst({
    where: { orgId, role: "OWNER" },
    include: { org: true },
  });

  if (!membership)
    return NextResponse.json({ error: "Not owner" }, { status: 403 });

  await prisma.organization.delete({ where: { id: orgId } });

  return NextResponse.json({ success: true });
}