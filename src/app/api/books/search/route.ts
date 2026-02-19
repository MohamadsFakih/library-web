import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = (searchParams.get("q") ?? "").trim();
  const genre = searchParams.get("genre") ?? "";

  const where: { OR?: { title?: { contains: string }; author?: { contains: string }; description?: { contains: string } }[]; genre?: string } = {};
  if (q) {
    where.OR = [
      { title: { contains: q } },
      { author: { contains: q } },
      { description: { contains: q } },
    ];
  }
  if (genre) where.genre = genre;

  const books = await prisma.book.findMany({
    where: Object.keys(where).length ? (where as object) : undefined,
    orderBy: { title: "asc" },
  });

  const withAvailability = await Promise.all(
    books.map(async (b) => {
      const active = await prisma.rental.count({
        where: { bookId: b.id, returnedAt: null },
      });
      return { ...b, available: Math.max(0, b.totalCopies - active) };
    })
  );

  return NextResponse.json(withAvailability);
}
