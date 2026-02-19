import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * AI-style recommendations: media similar to what's in the user's collection
 * (same genre or type). If no collection, returns popular/fresh media.
 */
export async function GET(request: Request) {
  const session = await auth();
  const { searchParams } = new URL(request.url);
  const limit = Math.min(Number(searchParams.get("limit")) || 6, 20);

  let recommended: { id: string; type: string; title: string; creator: string; genre: string | null; coverUrl: string | null; description: string | null; reason?: string }[] = [];

  if (session?.user?.id) {
    const myItems = await prisma.userMedia.findMany({
      where: { userId: session.user.id },
      include: { media: true },
      take: 30,
    });
    const genres = [...new Set(myItems.map((i) => i.media.genre).filter(Boolean))] as string[];
    const types = [...new Set(myItems.map((i) => i.media.type))];
    const excludeIds = myItems.map((i) => i.mediaId);

    if (genres.length > 0 || types.length > 0) {
      const byPreference = await prisma.media.findMany({
        where: {
          id: { notIn: excludeIds },
          ...(genres.length ? { genre: { in: genres } } : {}),
          ...(types.length ? { type: { in: types } } : {}),
        },
        take: limit,
        orderBy: { title: "asc" },
      });
      recommended = byPreference.map((m) => ({ ...m, reason: "Based on your collection" }));
    }

    if (recommended.length < limit) {
      const more = await prisma.media.findMany({
        where: { id: { notIn: [...excludeIds, ...recommended.map((r) => r.id)] } },
        take: limit - recommended.length,
        orderBy: { createdAt: "desc" },
      });
      recommended = [...recommended, ...more.map((m) => ({ ...m, reason: "New in catalog" }))];
    }
  } else {
    const all = await prisma.media.findMany({
      take: limit,
      orderBy: { createdAt: "desc" },
    });
    recommended = all.map((m) => ({ ...m, reason: "Popular" }));
  }

  return NextResponse.json(recommended);
}
