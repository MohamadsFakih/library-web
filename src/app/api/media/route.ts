import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const createSchema = z.object({
  type: z.enum(["MOVIE", "MUSIC", "GAME"]),
  title: z.string().min(1),
  creator: z.string().min(1),
  releaseDate: z.string().optional().nullable(),
  genre: z.string().optional(),
  description: z.string().optional(),
  coverUrl: z.string().optional(),
  metadata: z.string().optional(),
});

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q     = (searchParams.get("q") ?? "").trim();
  const genre = searchParams.get("genre") ?? "";
  const type  = searchParams.get("type") ?? "";

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: Record<string, any> = {
    status: "APPROVED", // users only see approved catalog items
  };
  if (q) {
    where.OR = [
      { title:       { contains: q } },
      { creator:     { contains: q } },
      { description: { contains: q } },
    ];
  }
  if (genre) where.genre = genre;
  if (type && ["MOVIE", "MUSIC", "GAME"].includes(type)) where.type = type;

  const media = await prisma.media.findMany({
    where,
    orderBy: { title: "asc" },
    include: {
      _count: { select: { userMedia: true } },
      createdBy: { select: { id: true, name: true, email: true } },
    },
  });

  return NextResponse.json(media);
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body   = await request.json();
    const parsed = createSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const isAdmin = session.user.role === "ADMIN";

    const media = await prisma.media.create({
      data: {
        ...parsed.data,
        releaseDate: parsed.data.releaseDate ? new Date(parsed.data.releaseDate) : null,
        createdById: session.user.id,
        // Admin submissions go live immediately; user submissions need review
        status: isAdmin ? "APPROVED" : "PENDING",
      },
    });

    return NextResponse.json(media);
  } catch (e) {
    console.error("Create media:", e);
    return NextResponse.json({ error: "Failed to create media" }, { status: 500 });
  }
}
