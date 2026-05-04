// src/app/api/orgs/route.ts

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function slugify(name: string) {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { name } = await req.json();
  if (!name?.trim()) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }

  const baseSlug = slugify(name);
  let slug = baseSlug;
  let i = 1;

  // ensure slug is unique
  while (await prisma.organization.findUnique({ where: { slug } })) {
    slug = `${baseSlug}-${i++}`;
  }

  const org = await prisma.organization.create({
    data: {
      name,
      slug,
      memberships: {
        create: {
          userId: session.user.id,
          role: "OWNER",
        },
      },
      subscription: {
        create: {
          stripeCustomerId: `pending_${session.user.id}`,
          plan: "FREE",
          status: "TRIALING",
        },
      },
    },
  });

  return NextResponse.json(org, { status: 201 });
}