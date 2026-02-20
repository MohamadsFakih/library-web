import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const bodySchema = z.object({ toUserId: z.string().min(1) });

/** POST: send a friend request to toUserId */
export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }
  const toUserId = parsed.data.toUserId;
  const fromUserId = session.user.id;

  if (toUserId === fromUserId) {
    return NextResponse.json({ error: "Cannot add yourself" }, { status: 400 });
  }

  const toUser = await prisma.user.findUnique({ where: { id: toUserId } });
  if (!toUser || toUser.disabled) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  // Check existing: either direction
  const existing = await prisma.friendship.findFirst({
    where: {
      OR: [
        { fromUserId, toUserId },
        { fromUserId: toUserId, toUserId: fromUserId },
      ],
    },
  });
  if (existing) {
    if (existing.status === "ACCEPTED") return NextResponse.json({ error: "Already friends" }, { status: 400 });
    if (existing.fromUserId === fromUserId) return NextResponse.json({ error: "Request already sent" }, { status: 400 });
    // They sent us a request — auto-accept and create reverse accepted row would be one option; here we just say already exists
    return NextResponse.json({ error: "They already sent you a request. Accept it from your requests." }, { status: 400 });
  }

  const friendship = await prisma.friendship.create({
    data: { fromUserId, toUserId, status: "PENDING" },
    include: { toUser: { select: { id: true, name: true, email: true, image: true } } },
  });

  // Create notification for the recipient
  await prisma.notification.create({
    data: { userId: toUserId, type: "FRIEND_REQUEST", actorId: fromUserId },
  });

  return NextResponse.json(friendship);
}
