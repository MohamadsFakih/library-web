import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const DEFAULT_DAYS = 14;

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const bookId = body?.bookId as string | undefined;
  if (!bookId) {
    return NextResponse.json({ error: "bookId required" }, { status: 400 });
  }

  const book = await prisma.book.findUnique({ where: { id: bookId } });
  if (!book) return NextResponse.json({ error: "Book not found" }, { status: 404 });

  const activeRentals = await prisma.rental.count({
    where: { bookId, returnedAt: null },
  });
  if (activeRentals >= book.totalCopies) {
    return NextResponse.json({ error: "No copies available" }, { status: 409 });
  }

  const existing = await prisma.rental.findFirst({
    where: { bookId, userId: session.user.id, returnedAt: null },
  });
  if (existing) {
    return NextResponse.json({ error: "You already have this book checked out" }, { status: 409 });
  }

  const dueAt = new Date();
  dueAt.setDate(dueAt.getDate() + DEFAULT_DAYS);

  const rental = await prisma.rental.create({
    data: {
      bookId,
      userId: session.user.id,
      dueAt,
    },
    include: { book: true },
  });

  return NextResponse.json(rental);
}
