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

  const formData = await request.formData();
  const file = formData.get("file") as File | null;
  if (!file?.size) return NextResponse.json({ error: "No file provided" }, { status: 400 });

  if (file.size > 4 * 1024 * 1024) {
    return NextResponse.json({ error: "Image must be under 4 MB." }, { status: 400 });
  }

  try {
    let coverUrl: string;

    if (process.env.BLOB_READ_WRITE_TOKEN) {
      const { put, del } = await import("@vercel/blob");
      if (media.coverUrl?.startsWith("https://")) {
        try { await del(media.coverUrl); } catch {}
      }
      const blob = await put(`media/${id}-${file.name}`, file, { access: "public" });
      coverUrl = blob.url;
    } else {
      const buffer = Buffer.from(await file.arrayBuffer());
      coverUrl = `data:${file.type};base64,${buffer.toString("base64")}`;
    }

    await prisma.media.update({ where: { id }, data: { coverUrl } });
    return NextResponse.json({ url: coverUrl });
  } catch (e) {
    console.error("Upload cover:", e);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
