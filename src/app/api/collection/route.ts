import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const statusEnum = z.enum(["OWNED", "WISHLIST", "IN_PROGRESS", "COMPLETED"]);

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status") ?? ""; // filter by status

  const where: { userId: string; status?: string } = { userId: session.user.id };
  if (status && ["OWNED", "WISHLIST", "IN_PROGRESS", "COMPLETED"].includes(status)) {
    where.status = status;
  }

  const items = await prisma.userMedia.findMany({
    where,
    orderBy: { addedAt: "desc" },
    include: { media: true },
  });

  return NextResponse.json(items);
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const schema = z.object({ mediaId: z.string().min(1), status: statusEnum.default("WISHLIST") });
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input", details: parsed.error.flatten() }, { status: 400 });
  }

  const media = await prisma.media.findUnique({ where: { id: parsed.data.mediaId } });
  if (!media) return NextResponse.json({ error: "Media not found" }, { status: 404 });

  const existing = await prisma.userMedia.findUnique({
    where: { userId_mediaId: { userId: session.user.id, mediaId: parsed.data.mediaId } },
  });
  if (existing) {
    return NextResponse.json({ error: "Already in your collection" }, { status: 409 });
  }

  const completedAt = parsed.data.status === "COMPLETED" ? new Date() : null;
  const entry = await prisma.userMedia.create({
    data: {
      userId: session.user.id,
      mediaId: parsed.data.mediaId,
      status: parsed.data.status,
      completedAt,
    },
    include: { media: true },
  });

  return NextResponse.json(entry);
}
