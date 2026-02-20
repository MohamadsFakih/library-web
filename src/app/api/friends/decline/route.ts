import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const bodySchema = z.object({ requestId: z.string().min(1) });

/** POST: decline a friend request */
export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  const friendship = await prisma.friendship.findUnique({
    where: { id: parsed.data.requestId },
  });
  if (!friendship) return NextResponse.json({ error: "Request not found" }, { status: 404 });
  if (friendship.toUserId !== session.user.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  await prisma.friendship.delete({ where: { id: friendship.id } });
  return NextResponse.json({ ok: true });
}
