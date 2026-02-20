import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/** PATCH: mark notification as read */
export async function PATCH(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const notif = await prisma.notification.findUnique({ where: { id } });
  if (!notif) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (notif.userId !== session.user.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  await prisma.notification.update({
    where: { id },
    data: { readAt: new Date() },
  });
  return NextResponse.json({ ok: true });
}
