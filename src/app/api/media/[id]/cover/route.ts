import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const media = await prisma.media.findUnique({ where: { id } });
  if (!media) return NextResponse.json({ error: "Media not found" }, { status: 404 });

  // Admin or the creator can upload a cover
  const isAdmin = session.user.role === "ADMIN";
  const isCreator = media.createdById === session.user.id;
  if (!isAdmin && !isCreator) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return NextResponse.json(
      { error: "Image storage not configured (BLOB_READ_WRITE_TOKEN missing)." },
      { status: 503 }
    );
  }

  const formData = await request.formData();
  const file = formData.get("file") as File | null;
  if (!file?.size) return NextResponse.json({ error: "No file provided" }, { status: 400 });

  try {
    const { put, del } = await import("@vercel/blob");
    if (media.coverUrl) {
      try { await del(media.coverUrl); } catch {}
    }
    const blob = await put(`media/${id}-${file.name}`, file, { access: "public" });
    await prisma.media.update({ where: { id }, data: { coverUrl: blob.url } });
    return NextResponse.json({ url: blob.url });
  } catch (e) {
    console.error("Upload cover:", e);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
