import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const createSchema = z.object({
  body: z.string().min(1).max(2000),
});

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: mediaId } = await params;
  const media = await prisma.media.findUnique({ where: { id: mediaId } });
  if (!media) return NextResponse.json({ error: "Media not found" }, { status: 404 });

  const comments = await prisma.comment.findMany({
    where: { mediaId },
    orderBy: { createdAt: "asc" },
    include: { user: { select: { id: true, name: true, image: true } } },
  });
  return NextResponse.json(comments);
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

  const comment = await prisma.comment.create({
    data: {
      userId: session.user.id,
      mediaId,
      body: parsed.data.body,
    },
    include: { user: { select: { id: true, name: true, image: true } } },
  });
  return NextResponse.json(comment);
}
