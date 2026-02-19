import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const updateSchema = z.object({
  title: z.string().min(1).optional(),
  author: z.string().min(1).optional(),
  isbn: z.string().optional(),
  genre: z.string().optional(),
  description: z.string().optional(),
  coverUrl: z.string().optional(),
  totalCopies: z.number().int().min(1).optional(),
});

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const book = await prisma.book.findUnique({
    where: { id },
    include: {
      _count: { select: { rentals: true } },
    },
  });
  if (!book) return NextResponse.json({ error: "Book not found" }, { status: 404 });

  const activeRentals = await prisma.rental.count({
    where: { bookId: id, returnedAt: null },
  });
  return NextResponse.json({
    ...book,
    available: Math.max(0, book.totalCopies - activeRentals),
  });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error: adminError } = await requireAdmin();
  if (adminError) return adminError;

  const { id } = await params;
  const book = await prisma.book.findUnique({ where: { id } });
  if (!book) return NextResponse.json({ error: "Book not found" }, { status: 404 });

  try {
    const body = await request.json();
    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.flatten() },
        { status: 400 }
      );
    }
    const updated = await prisma.book.update({
      where: { id },
      data: parsed.data,
    });
    return NextResponse.json(updated);
  } catch (e) {
    console.error("Update book:", e);
    return NextResponse.json({ error: "Failed to update book" }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error: adminError } = await requireAdmin();
  if (adminError) return adminError;

  const { id } = await params;
  const book = await prisma.book.findUnique({ where: { id } });
  if (!book) return NextResponse.json({ error: "Book not found" }, { status: 404 });

  await prisma.book.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
