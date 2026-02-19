import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * Public collection for a user (profile sharing).
 * Returns user name and their collection items with media, only if profilePublic.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: userId } = await params;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, name: true, email: true, profilePublic: true, image: true },
  });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });
  if (!user.profilePublic) {
    return NextResponse.json({ error: "Collection is private" }, { status: 403 });
  }

  const items = await prisma.userMedia.findMany({
    where: { userId },
    orderBy: { addedAt: "desc" },
    include: { media: true },
  });

  return NextResponse.json({
    user: { id: user.id, name: user.name, email: user.email, image: user.image },
    collection: items,
  });
}
