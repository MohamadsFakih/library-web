import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export interface AISuggestion {
  type: "MOVIE" | "MUSIC" | "GAME";
  title: string;
  creator: string;
  genre: string;
  releaseYear?: number;
  description: string;
  // Populated by server
  existingId?: string;
  existingCoverUrl?: string | null;
  suggestedImageUrl?: string | null;
}

// ── Prompt ────────────────────────────────────────────────────────────────────
const SYSTEM_PROMPT = `You are a media database assistant. When a user describes what they want, suggest 3–5 real, well-known media items (movies, TV shows, music albums, or video games) that best match.

Rules:
- Only suggest real, existing works — no fictional titles.
- Keep descriptions under 20 words.
- Respond with ONLY a valid JSON array — no markdown, no explanation, no extra text before or after.

JSON schema for each item:
{"type":"GAME"|"MOVIE"|"MUSIC","title":"string","creator":"string","genre":"string","releaseYear":number,"description":"string"}`;

function buildPrompt(description: string): string {
  return `${SYSTEM_PROMPT}\n\nUser wants: "${description}"\n\nJSON array:`;
}

// ── JSON extraction (resilient) ───────────────────────────────────────────────
function extractJsonArray(raw: string): AISuggestion[] {
  const cleaned = raw.trim();

  try {
    const p = JSON.parse(cleaned);
    if (Array.isArray(p)) return p;
  } catch {}

  const start = cleaned.indexOf("[");
  const end = cleaned.lastIndexOf("]");
  if (start !== -1 && end > start) {
    try {
      const p = JSON.parse(cleaned.slice(start, end + 1));
      if (Array.isArray(p)) return p;
    } catch {}
  }

  const objRegex = /\{[^{}]+\}/g;
  const objs: string[] = [];
  let m;
  while ((m = objRegex.exec(cleaned)) !== null) objs.push(m[0]);
  if (objs.length) {
    try {
      const p = JSON.parse(`[${objs.join(",")}]`);
      if (Array.isArray(p)) return p;
    } catch {}
  }

  return [];
}

// ── iTunes Search API for cover art ──────────────────────────────────────────
const ITUNES_ENTITY: Record<string, string> = {
  MUSIC: "album",
  MOVIE: "movie",
  GAME:  "software",
};

async function fetchCoverImage(
  title: string,
  creator: string,
  type: string
): Promise<string | null> {
  try {
    const entity = ITUNES_ENTITY[type] ?? "movie";
    const term = encodeURIComponent(`${title} ${creator}`);
    const url = `https://itunes.apple.com/search?term=${term}&entity=${entity}&limit=3&media=${type === "GAME" ? "software" : type === "MUSIC" ? "music" : "movie"}`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);

    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);

    if (!res.ok) return null;
    const data = await res.json();
    const results = data.results ?? [];
    if (!results.length) return null;

    // Try to find the best match (title similarity)
    const normTitle = title.toLowerCase();
    const best =
      results.find((r: { trackName?: string; collectionName?: string }) =>
        (r.trackName ?? r.collectionName ?? "").toLowerCase().includes(normTitle.slice(0, 15))
      ) ?? results[0];

    // iTunes artwork comes in 100x100; replace for higher res
    const art: string | undefined = best.artworkUrl100;
    if (!art) return null;
    return art.replace("100x100bb", "512x512bb");
  } catch {
    return null;
  }
}

// ── DB matching + image enrichment ───────────────────────────────────────────
function normalise(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9\s]/g, "").trim();
}

async function enrichWithDB(suggestions: AISuggestion[]): Promise<AISuggestion[]> {
  const results: AISuggestion[] = [];

  for (const s of suggestions) {
    if (!s.title || !s.creator) continue;
    if (!["MOVIE", "MUSIC", "GAME"].includes(s.type)) s.type = "GAME";

    // Check DB for existing entry
    const normTitle = normalise(s.title);
    const existing = await prisma.media.findFirst({
      where: { title: { contains: s.title.substring(0, 20) } },
      select: { id: true, title: true, coverUrl: true },
    });

    let matched = existing;
    if (!matched) {
      const firstWord = normTitle.split(" ")[0];
      if (firstWord && firstWord.length > 3) {
        const candidates = await prisma.media.findMany({
          where: { title: { contains: firstWord } },
          select: { id: true, title: true, coverUrl: true },
        });
        matched =
          candidates.find(
            (c) =>
              normalise(c.title) === normTitle ||
              normalise(c.title).includes(normTitle)
          ) ?? null;
      }
    }

    // Fetch cover image from iTunes for new items (or existing items without a cover)
    let suggestedImageUrl: string | null = null;
    if (!matched?.coverUrl) {
      suggestedImageUrl = await fetchCoverImage(s.title, s.creator, s.type);
    }

    results.push({
      ...s,
      existingId: matched?.id,
      existingCoverUrl: matched?.coverUrl ?? null,
      suggestedImageUrl,
    });
  }

  return results;
}

// ── Route handler ─────────────────────────────────────────────────────────────
export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const token = process.env.HUGGINGFACE_TOKEN;
  if (!token) {
    return NextResponse.json(
      { error: "HUGGINGFACE_TOKEN is not configured." },
      { status: 503 }
    );
  }

  let description = "";
  try {
    const body = await request.json();
    description = (body.description ?? "").trim();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  if (description.length < 3) {
    return NextResponse.json(
      { error: "Please describe what you're looking for." },
      { status: 400 }
    );
  }

  // Use the new router endpoint (api-inference.huggingface.co is deprecated)
  const model =
    process.env.HUGGINGFACE_MODEL ?? "mistralai/Mistral-7B-Instruct-v0.3";
  const prompt = buildPrompt(description);

  let raw = "";
  try {
    const hfRes = await fetch(
      `https://router.huggingface.co/hf-inference/models/${model}`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          "x-wait-for-model": "true",
        },
        body: JSON.stringify({
          inputs: prompt,
          parameters: {
            max_new_tokens: 900,
            temperature: 0.4,
            return_full_text: false,
            stop: ["\n\nUser", "\n\nHuman", "---"],
          },
        }),
      }
    );

    if (!hfRes.ok) {
      const errText = await hfRes.text();
      console.error("HuggingFace error:", hfRes.status, errText);
      if (hfRes.status === 503) {
        return NextResponse.json(
          {
            error:
              "The AI model is warming up — please try again in ~20 seconds.",
            retryable: true,
          },
          { status: 503 }
        );
      }
      return NextResponse.json(
        { error: `AI service error (${hfRes.status})` },
        { status: 502 }
      );
    }

    const hfData = await hfRes.json();
    raw = Array.isArray(hfData)
      ? (hfData[0]?.generated_text ?? "")
      : (hfData.generated_text ?? JSON.stringify(hfData));
  } catch (e) {
    console.error("HuggingFace fetch failed:", e);
    return NextResponse.json(
      { error: "Failed to reach AI service." },
      { status: 502 }
    );
  }

  const suggestions = extractJsonArray(raw);
  if (!suggestions.length) {
    console.warn("Could not parse AI response:", raw.slice(0, 300));
    return NextResponse.json(
      {
        error:
          "The AI didn't return usable suggestions. Try a more specific description.",
      },
      { status: 422 }
    );
  }

  const enriched = await enrichWithDB(suggestions.slice(0, 5));
  return NextResponse.json({ suggestions: enriched, model });
}
