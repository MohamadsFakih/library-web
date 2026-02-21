import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const updateSchema = z.object({
  type:          z.enum(["MOVIE", "MUSIC", "GAME"]).optional(),
  title:         z.string().min(1).optional(),
  creator:       z.string().min(1).optional(),
  releaseDate:   z.string().optional().nullable(),
  genre:         z.string().optional().nullable(),
  description:   z.string().optional().nullable(),
  coverUrl:      z.string().optional().nullable(),
  metadata:      z.string().optional().nullable(),
  // Admin-only fields
  status:        z.enum(["PENDING", "APPROVED", "REJECTED"]).optional(),
  rejectionNote: z.string().optional().nullable(),
});

export async function GET(
  _req: Request,
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
  if (!media) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(media);
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const media = await prisma.media.findUnique({ where: { id } });
  if (!media) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const isAdmin   = session.user.role === "ADMIN";
  const isCreator = media.createdById === session.user.id;

  // Users can only edit their own PENDING submissions; admin can edit anything
  if (!isAdmin && !(isCreator && media.status === "PENDING")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body   = await request.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const raw  = parsed.data;
  // Non-admins cannot change status
  if (!isAdmin) { delete raw.status; delete raw.rejectionNote; }

  const updated = await prisma.media.update({
    where: { id },
    data: {
      ...raw,
      releaseDate: raw.releaseDate !== undefined
        ? (raw.releaseDate ? new Date(raw.releaseDate) : null)
        : undefined,
    },
  });
  return NextResponse.json(updated);
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const media = await prisma.media.findUnique({ where: { id } });
  if (!media) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const isAdmin   = session.user.role === "ADMIN";
  const isCreator = media.createdById === session.user.id;

  // Users can only delete their own PENDING or REJECTED suggestions; admins can delete anything
  if (!isAdmin && !(isCreator && media.status !== "APPROVED")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await prisma.media.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
