import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const updateSchema = z.object({
  type: z.enum(["MOVIE", "MUSIC", "GAME"]).optional(),
  title: z.string().min(1).optional(),
  creator: z.string().min(1).optional(),
  releaseDate: z.string().optional().nullable(),
  genre: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  coverUrl: z.string().optional().nullable(),
  metadata: z.string().optional().nullable(),
});

async function resolveAccess(id: string) {
  const session = await auth();
  const media = await prisma.media.findUnique({ where: { id } });
  if (!media) return { media: null, allowed: false };
  const isAdmin = session?.user?.role === "ADMIN";
  const isCreator = !!session?.user?.id && media.createdById === session.user.id;
  return { media, allowed: isAdmin || isCreator };
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const media = await prisma.media.findUnique({
    where: { id },
    include: {
      _count: { select: { userMedia: true } },
      createdBy: { select: { id: true, name: true, email: true } },
    },
  });
  if (!media) return NextResponse.json({ error: "Media not found" }, { status: 404 });
  return NextResponse.json(media);
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { media, allowed } = await resolveAccess(id);
  if (!media) return NextResponse.json({ error: "Media not found" }, { status: 404 });
  if (!allowed) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    const body = await request.json();
    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.flatten() },
        { status: 400 }
      );
    }
    const raw = parsed.data;
    const data = {
      ...raw,
      releaseDate: raw.releaseDate !== undefined
        ? (raw.releaseDate ? new Date(raw.releaseDate) : null)
        : undefined,
    };
    const updated = await prisma.media.update({ where: { id }, data });
    return NextResponse.json(updated);
  } catch (e) {
    console.error("Update media:", e);
    return NextResponse.json({ error: "Failed to update media" }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { media, allowed } = await resolveAccess(id);
  if (!media) return NextResponse.json({ error: "Media not found" }, { status: 404 });
  if (!allowed) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  await prisma.media.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
