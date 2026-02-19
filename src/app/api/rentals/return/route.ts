import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const rentalId = body?.rentalId as string | undefined;
  if (!rentalId) {
    return NextResponse.json({ error: "rentalId required" }, { status: 400 });
  }

  const rental = await prisma.rental.findUnique({
    where: { id: rentalId },
    include: { book: true },
  });
  if (!rental) return NextResponse.json({ error: "Rental not found" }, { status: 404 });
  if (rental.userId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  if (rental.returnedAt) {
    return NextResponse.json({ error: "Already returned" }, { status: 400 });
  }

  const updated = await prisma.rental.update({
    where: { id: rentalId },
    data: { returnedAt: new Date() },
    include: { book: true },
  });

  return NextResponse.json(updated);
}
