// src/app/api/members/[id]/route.ts

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getOrgIdFromSession } from "@/lib/api-helpers";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { orgId, error, status } = await getOrgIdFromSession();
  if (error || !orgId)
    return NextResponse.json({ error }, { status: status ?? 401 });

  const { id } = await params;
  const { role } = await req.json();

  const membership = await prisma.membership.findFirst({
    where: { id, orgId },
  });
  if (!membership)
    return NextResponse.json({ error: "Member not found" }, { status: 404 });

  const updated = await prisma.membership.update({
    where: { id },
    data: { role },
    include: { user: { select: { id: true, name: true, email: true, image: true } } },
  });

  return NextResponse.json(updated);
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { orgId, error, status } = await getOrgIdFromSession();
  if (error || !orgId)
    return NextResponse.json({ error }, { status: status ?? 401 });

  const { id } = await params;

  const membership = await prisma.membership.findFirst({
    where: { id, orgId },
  });
  if (!membership)
    return NextResponse.json({ error: "Member not found" }, { status: 404 });

  // Can't remove the owner
  if (membership.role === "OWNER")
    return NextResponse.json({ error: "Cannot remove owner" }, { status: 400 });

  await prisma.membership.delete({ where: { id } });
  return NextResponse.json({ success: true });
}