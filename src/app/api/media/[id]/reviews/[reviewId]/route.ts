import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const updateSchema = z.object({
  rating: z.number().min(1).max(5).optional(),
  body: z.string().max(2000).optional().nullable(),
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string; reviewId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: mediaId, reviewId } = await params;
  const review = await prisma.review.findFirst({
    where: { id: reviewId, mediaId },
  });
  if (!review) return NextResponse.json({ error: "Review not found" }, { status: 404 });
  if (review.userId !== session.user.id && session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const updated = await prisma.review.update({
    where: { id: reviewId },
    data: parsed.data,
    include: { user: { select: { id: true, name: true, image: true } } },
  });
  return NextResponse.json(updated);
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string; reviewId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { reviewId } = await params;
  const review = await prisma.review.findUnique({ where: { id: reviewId } });
  if (!review) return NextResponse.json({ error: "Review not found" }, { status: 404 });
  if (review.userId !== session.user.id && session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await prisma.review.delete({ where: { id: reviewId } });
  return NextResponse.json({ ok: true });
}
