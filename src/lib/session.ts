// src/lib/session.ts

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { getActiveOrgId } from "@/lib/active-org";

export async function getRequiredSession() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/login");
  return session;
}

export async function getCurrentMembership() {
  const session = await getRequiredSession();
  const activeOrgId = await getActiveOrgId();

  // Try to use the active org from cookie
  if (activeOrgId) {
    const membership = await prisma.membership.findFirst({
      where: { userId: session.user.id, orgId: activeOrgId },
      include: { org: true },
    });
    if (membership) return membership;
  }

  // Fall back to first org
  const membership = await prisma.membership.findFirst({
    where: { userId: session.user.id },
    include: { org: true },
  });

  if (!membership) redirect("/onboarding");
  return membership;
}

export async function getAllMemberships() {
  const session = await getRequiredSession();
  return prisma.membership.findMany({
    where: { userId: session.user.id },
    include: { org: true },
    orderBy: { org: { createdAt: "asc" } },
  });
}