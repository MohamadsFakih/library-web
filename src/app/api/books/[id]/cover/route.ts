import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import { prisma } from "@/lib/prisma";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error: adminError } = await requireAdmin();
  if (adminError) return adminError;

  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return NextResponse.json({ error: "Storage not configured. Set BLOB_READ_WRITE_TOKEN." }, { status: 503 });
  }

  const { id } = await params;
  const book = await prisma.book.findUnique({ where: { id } });
  if (!book) return NextResponse.json({ error: "Book not found" }, { status: 404 });

  const formData = await request.formData();
  const file = formData.get("file") as File | null;
  if (!file?.size) return NextResponse.json({ error: "No file" }, { status: 400 });

  try {
    const { put, del } = await import("@vercel/blob");
    if (book.coverUrl) {
      try { await del(book.coverUrl); } catch {}
    }
    const blob = await put(`books/${id}-${file.name}`, file, { access: "public" });
    await prisma.book.update({ where: { id }, data: { coverUrl: blob.url } });
    return NextResponse.json({ url: blob.url });
  } catch (e) {
    console.error("Upload cover:", e);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
