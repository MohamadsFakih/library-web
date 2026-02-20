import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/** GET: unread notification count (for badge) */
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ count: 0 });

  const count = await prisma.notification.count({
    where: { userId: session.user.id, readAt: null },
  });
  return NextResponse.json({ count });
}
