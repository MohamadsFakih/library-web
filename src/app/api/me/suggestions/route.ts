import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const suggestions = await prisma.media.findMany({
    where: {
      createdById: session.user.id,
      status:      { in: ["PENDING", "APPROVED", "REJECTED"] },
    },
    orderBy: { createdAt: "desc" },
    select: {
      id: true, type: true, title: true, creator: true,
      coverUrl: true, status: true, rejectionNote: true, createdAt: true,
    },
  });

  return NextResponse.json(suggestions);
}
