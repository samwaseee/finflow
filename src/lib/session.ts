// src/lib/session.ts

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

export async function getRequiredSession() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/login");
  return session;
}

export async function getCurrentMembership() {
  const session = await getRequiredSession();

  const membership = await prisma.membership.findFirst({
    where: { userId: session.user.id },
    include: { org: true },
  });

  if (!membership) redirect("/onboarding");

  return membership;
}