// src/lib/session.ts

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";

export async function getRequiredSession() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/login");
  return session;
}

export async function getCurrentMembership() {
  const session = await getRequiredSession();

  const cookieStore = await cookies();
  const activeOrgId = cookieStore.get("active_org_id")?.value;

  if (activeOrgId) {
    const membership = await prisma.membership.findFirst({
      where: { userId: session.user.id, orgId: activeOrgId },
      include: { org: true },
    });
    if (membership) return membership;
  }

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