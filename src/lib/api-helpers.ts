// src/lib/api-helpers.ts

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function getOrgIdFromSession() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return { error: "Unauthorized", status: 401, orgId: null };

  const cookieStore = await cookies();
  const activeOrgId = cookieStore.get("active_org_id")?.value;

  if (activeOrgId) {
    const membership = await prisma.membership.findFirst({
      where: { userId: session.user.id, orgId: activeOrgId },
      select: { orgId: true },
    });
    if (membership) return { orgId: membership.orgId, error: null };
  }

  // Fall back to first org
  const membership = await prisma.membership.findFirst({
    where: { userId: session.user.id },
    select: { orgId: true },
  });

  if (!membership) return { error: "No organization", status: 404, orgId: null };
  return { orgId: membership.orgId, error: null };
}