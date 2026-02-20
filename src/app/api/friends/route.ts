import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/** GET: list accepted friends (users who are friends with current user) */
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const uid = session.user.id;
  const friendships = await prisma.friendship.findMany({
    where: { status: "ACCEPTED", OR: [{ fromUserId: uid }, { toUserId: uid }] },
    include: {
      fromUser: { select: { id: true, name: true, email: true, image: true } },
      toUser: { select: { id: true, name: true, email: true, image: true } },
    },
  });

  const friends = friendships.map((f) =>
    f.fromUserId === uid ? f.toUser : f.fromUser
  );
  return NextResponse.json(friends);
}
