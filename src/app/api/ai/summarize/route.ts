import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import OpenAI from "openai";

/**
 * Optional AI summary of a book (description) using OpenAI.
 * Set OPENAI_API_KEY in env to enable.
 */
export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const bookId = body?.bookId as string | undefined;
  if (!bookId) {
    return NextResponse.json({ error: "bookId required" }, { status: 400 });
  }

  const book = await prisma.book.findUnique({ where: { id: bookId } });
  if (!book) return NextResponse.json({ error: "Book not found" }, { status: 404 });

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { summary: null, message: "AI summarization not configured. Add OPENAI_API_KEY to enable." },
      { status: 200 }
    );
  }

  try {
    const openai = new OpenAI({ apiKey });
    const text = [book.title, book.author, book.description].filter(Boolean).join(". ");
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "user",
          content: `In 2-3 sentences, summarize this book for a library catalog: "${text}". Be concise and avoid spoilers.`,
        },
      ],
      max_tokens: 150,
    });
    const summary = completion.choices[0]?.message?.content?.trim() ?? null;
    return NextResponse.json({ summary });
  } catch (e) {
    console.error("AI summarize:", e);
    return NextResponse.json({ error: "Summarization failed" }, { status: 500 });
  }
}
