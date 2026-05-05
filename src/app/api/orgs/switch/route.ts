// src/app/api/orgs/switch/route.ts

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { orgId } = await req.json();

  // Verify user is actually a member of this org
  const membership = await prisma.membership.findFirst({
    where: { userId: session.user.id, orgId },
  });

  if (!membership)
    return NextResponse.json({ error: "Not a member" }, { status: 403 });

  const response = NextResponse.json({ success: true });

  // Set cookie on the response
  response.cookies.set("active_org_id", orgId, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });

  return response;
}