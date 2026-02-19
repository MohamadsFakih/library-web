import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * AI-powered book recommendations based on user's rental history.
 * Returns books in genres the user has borrowed, or popular books if no history.
 */
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const pastRentals = await prisma.rental.findMany({
    where: { userId: session.user.id, returnedAt: { not: null } },
    include: { book: true },
    orderBy: { returnedAt: "desc" },
    take: 20,
  });

  const genres = [...new Set(pastRentals.map((r) => r.book.genre).filter(Boolean))] as string[];
  const authorIds = pastRentals.map((r) => r.book.id);

  let recommended: { id: string; title: string; author: string; genre: string | null; coverUrl: string | null; available: number; totalCopies: number; reason?: string }[] = [];

  if (genres.length > 0) {
    const byGenre = await prisma.book.findMany({
      where: {
        genre: { in: genres },
        id: { notIn: authorIds },
      },
      take: 6,
      orderBy: { title: "asc" },
    });
    const withAvailability = await Promise.all(
      byGenre.map(async (b) => {
        const active = await prisma.rental.count({ where: { bookId: b.id, returnedAt: null } });
        return { ...b, available: Math.max(0, b.totalCopies - active), reason: "Based on genres you've read" };
      })
    );
    recommended = withAvailability;
  }

  if (recommended.length < 6) {
    const more = await prisma.book.findMany({
      where: { id: { notIn: [...authorIds, ...recommended.map((r) => r.id)] } },
      take: 6 - recommended.length,
      orderBy: { title: "asc" },
    });
    const withAvailability = await Promise.all(
      more.map(async (b) => {
        const active = await prisma.rental.count({ where: { bookId: b.id, returnedAt: null } });
        return { ...b, available: Math.max(0, b.totalCopies - active), reason: "Popular in the library" };
      })
    );
    recommended = [...recommended, ...withAvailability];
  }

  return NextResponse.json(recommended);
}
