import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const createSchema = z.object({
  title: z.string().min(1),
  author: z.string().min(1),
  isbn: z.string().optional(),
  genre: z.string().optional(),
  description: z.string().optional(),
  coverUrl: z.string().optional(),
  totalCopies: z.number().int().min(1).default(1),
});

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q") ?? "";
  const genre = searchParams.get("genre") ?? "";

  type Where = { OR?: { title?: { contains: string }; author?: { contains: string }; description?: { contains: string } }[]; genre?: string };
  const where: Where = {};
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
    include: {
      _count: { select: { rentals: true } },
    },
  });

  // Add available count (totalCopies - active rentals)
  const withAvailability = await Promise.all(
    books.map(async (b) => {
      const activeRentals = await prisma.rental.count({
        where: { bookId: b.id, returnedAt: null },
      });
      return {
        ...b,
        available: Math.max(0, b.totalCopies - activeRentals),
      };
    })
  );

  return NextResponse.json(withAvailability);
}

export async function POST(request: Request) {
  const { error: adminError } = await requireAdmin();
  if (adminError) return adminError;

  try {
    const body = await request.json();
    const parsed = createSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.flatten() },
        { status: 400 }
      );
    }
    const book = await prisma.book.create({ data: parsed.data });
    return NextResponse.json(book);
  } catch (e) {
    console.error("Create book:", e);
    return NextResponse.json({ error: "Failed to create book" }, { status: 500 });
  }
}
