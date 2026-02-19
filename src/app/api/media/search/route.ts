import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = (searchParams.get("q") ?? "").trim();
  const genre = searchParams.get("genre") ?? "";
  const type = searchParams.get("type") ?? "";

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: Record<string, any> = {};
  if (q) {
    where.OR = [
      { title: { contains: q } },
      { creator: { contains: q } },
      { description: { contains: q } },
    ];
  }
  if (genre) where.genre = genre;
  if (type && ["MOVIE", "MUSIC", "GAME"].includes(type)) where.type = type;

  const media = await prisma.media.findMany({
    where: Object.keys(where).length ? where : undefined,
    orderBy: { title: "asc" },
  });

  return NextResponse.json(media);
}
