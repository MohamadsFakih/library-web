import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const unreadOnly = searchParams.get("unreadOnly") === "true";

  const where: { userId: string; readAt?: null } = { userId: session.user.id };
  if (unreadOnly) where.readAt = null;

  const notifications = await prisma.notification.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 30,
    select: {
      id: true, type: true, readAt: true, createdAt: true,
      mediaId: true, mediaTitle: true,
      actor: { select: { id: true, name: true, email: true } },
    },
  });

  return NextResponse.json(notifications);
}
