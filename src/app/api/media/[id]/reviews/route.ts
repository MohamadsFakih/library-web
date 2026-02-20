import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const createSchema = z.object({
  rating: z.number().min(1).max(5),
  body: z.string().max(2000).optional(),
});

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: mediaId } = await params;
  const media = await prisma.media.findUnique({ where: { id: mediaId } });
  if (!media) return NextResponse.json({ error: "Media not found" }, { status: 404 });

  const reviews = await prisma.review.findMany({
    where: { mediaId },
    orderBy: { createdAt: "desc" },
    include: { user: { select: { id: true, name: true, image: true } } },
  });

  const avg =
    reviews.length > 0
      ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length
      : null;

  return NextResponse.json({
    reviews,
    averageRating: avg !== null ? Math.round(avg * 10) / 10 : null,
    total: reviews.length,
  });
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: mediaId } = await params;
  const media = await prisma.media.findUnique({ where: { id: mediaId } });
  if (!media) return NextResponse.json({ error: "Media not found" }, { status: 404 });

  const body = await request.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const review = await prisma.review.create({
    data: {
      userId: session.user.id,
      mediaId,
      rating: parsed.data.rating,
      body: parsed.data.body ?? null,
    },
    include: { user: { select: { id: true, name: true, image: true } } },
  });
  return NextResponse.json(review);
}
