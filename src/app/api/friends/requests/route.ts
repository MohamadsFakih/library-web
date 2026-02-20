import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/** GET: incoming (pending) and outgoing friend requests */
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const uid = session.user.id;
  const pending = await prisma.friendship.findMany({
    where: { toUserId: uid, status: "PENDING" },
    include: {
      fromUser: { select: { id: true, name: true, email: true, image: true } },
    },
  });
  const outgoing = await prisma.friendship.findMany({
    where: { fromUserId: uid, status: "PENDING" },
    include: {
      toUser: { select: { id: true, name: true, email: true, image: true } },
    },
  });

  return NextResponse.json({
    incoming: pending.map((f) => ({ id: f.id, from: f.fromUser, createdAt: f.createdAt })),
    outgoing: outgoing.map((f) => ({ id: f.id, to: f.toUser, createdAt: f.createdAt })),
  });
}
