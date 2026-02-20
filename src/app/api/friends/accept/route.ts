import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const bodySchema = z.object({ requestId: z.string().min(1) });

/** POST: accept a friend request (requestId = friendship id) */
export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const friendship = await prisma.friendship.findUnique({
    where: { id: parsed.data.requestId },
  });
  if (!friendship) return NextResponse.json({ error: "Request not found" }, { status: 404 });
  if (friendship.toUserId !== session.user.id) {
    return NextResponse.json({ error: "Not your request" }, { status: 403 });
  }
  if (friendship.status !== "PENDING") {
    return NextResponse.json({ error: "Already handled" }, { status: 400 });
  }

  await prisma.friendship.update({
    where: { id: friendship.id },
    data: { status: "ACCEPTED" },
  });

  // Notify the person who sent the request that they were accepted
  await prisma.notification.create({
    data: {
      userId: friendship.fromUserId,
      type: "FRIEND_ACCEPTED",
      actorId: session.user.id,
    },
  });

  return NextResponse.json({ ok: true });
}
