import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/** GET: friendship status with target user — "none" | "friends" | "pending_sent" | "pending_received" */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const targetId = (await params).userId;
  if (targetId === session.user.id) {
    return NextResponse.json({ status: "self" });
  }

  const friendship = await prisma.friendship.findFirst({
    where: {
      OR: [
        { fromUserId: session.user.id, toUserId: targetId },
        { fromUserId: targetId, toUserId: session.user.id },
      ],
    },
  });

  if (!friendship) return NextResponse.json({ status: "none" });
  if (friendship.status === "ACCEPTED") return NextResponse.json({ status: "friends" });
  if (friendship.fromUserId === session.user.id) return NextResponse.json({ status: "pending_sent" });
  return NextResponse.json({ status: "pending_received", requestId: friendship.id });
}
