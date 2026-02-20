import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/** GET ?q=... — search users by name or email (for add friend). Excludes current user and disabled. */
export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim();
  if (!q || q.length < 2) {
    return NextResponse.json([]);
  }

  const users = await prisma.user.findMany({
    where: {
      disabled: false,
      id: { not: session.user.id },
      OR: [
        { name: { contains: q } },
        { email: { contains: q } },
      ],
    },
    select: { id: true, name: true, email: true, image: true, profilePublic: true },
    take: 20,
  });
  return NextResponse.json(users);
}
