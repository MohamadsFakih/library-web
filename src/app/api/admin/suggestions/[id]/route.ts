import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const schema = z.object({
  action:        z.enum(["approve", "reject"]),
  rejectionNote: z.string().optional(),
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error, session } = await requireAdmin();
  if (error) return error;

  const { id } = await params;
  const media = await prisma.media.findUnique({ where: { id } });
  if (!media) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body   = await request.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  const { action, rejectionNote } = parsed.data;
  const isApproved = action === "approve";

  const updated = await prisma.media.update({
    where: { id },
    data: {
      status:        isApproved ? "APPROVED" : "REJECTED",
      rejectionNote: isApproved ? null : (rejectionNote ?? null),
    },
  });

  // Notify the suggester (skip if they are the admin themselves, or if system-seeded)
  if (media.createdById && media.createdById !== session!.user.id) {
    await prisma.notification.create({
      data: {
        userId:     media.createdById,
        type:       isApproved ? "MEDIA_APPROVED" : "MEDIA_REJECTED",
        actorId:    session!.user.id,
        mediaId:    media.id,
        mediaTitle: media.title,
      },
    });
  }

  return NextResponse.json(updated);
}
