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

// HuggingFace Responses API (same endpoint used in recipe-web)
const HF_ROUTER = "https://router.huggingface.co/v1/responses";
const DEFAULT_MODEL = "mistralai/Mistral-7B-Instruct-v0.2";

// ── HF response extraction (handles all shapes the Responses API can return) ─
function getOutputText(data: unknown): string {
  if (!data || typeof data !== "object") return "";
  const d = data as Record<string, unknown>;
  if (typeof d.output_text === "string") return d.output_text;
  const output = d.output;
  if (Array.isArray(output) && output.length > 0) {
    const first = output[0] as Record<string, unknown>;
    if (Array.isArray(first.content)) {
      for (const part of first.content) {
        const p = part as Record<string, unknown>;
        if (p.type === "output_text" && typeof p.text === "string") return p.text;
        if (typeof p.content === "string") return p.content;
      }
    }
    if (typeof first.text === "string") return first.text;
  }
  // Fallback: find first substantial string anywhere in the response
  function findFirstText(obj: unknown): string {
    if (typeof obj === "string" && obj.length > 10) return obj;
    if (!obj || typeof obj !== "object") return "";
    if (Array.isArray(obj)) {
      for (const item of obj) {
        const s = findFirstText(item);
        if (s) return s;
      }
      return "";
    }
    for (const v of Object.values(obj as Record<string, unknown>)) {
      const s = findFirstText(v);
      if (s) return s;
    }
    return "";
  }
  return findFirstText(d);
}

// ── JSON array extraction (resilient) ─────────────────────────────────────────
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

  // Extract individual JSON objects and wrap them
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

// ── Cover image helpers ───────────────────────────────────────────────────────

function abortAfter(ms: number): AbortController {
  const c = new AbortController();
  setTimeout(() => c.abort(), ms);
  return c;
}

/** Steam Store search — free, no key. Returns portrait library cover (600×900). */
async function fetchSteamImage(title: string): Promise<string | null> {
  try {
    const term = encodeURIComponent(title);
    const res = await fetch(
      `https://store.steampowered.com/api/storesearch/?term=${term}&cc=us&l=en`,
      { signal: abortAfter(5000).signal }
    );
    if (!res.ok) return null;
    const data = await res.json();
    const items: { id: number; name: string }[] = data.items ?? [];
    if (!items.length) return null;

    // Pick closest title match, fall back to first result
    const norm = title.toLowerCase();
    const best =
      items.find((i) => i.name.toLowerCase().includes(norm.slice(0, 15))) ??
      items[0];

    const appid = best.id;
    // library_600x900 = tall portrait box art (preferred)
    // header.jpg      = landscape 460×215 (universal fallback)
    return `https://cdn.akamai.steamstatic.com/steam/apps/${appid}/library_600x900.jpg`;
  } catch {
    return null;
  }
}

/** RAWG.io — free API key (rawg.io/apidocs). Covers PC + all consoles. */
async function fetchRawgImage(title: string): Promise<string | null> {
  const key = process.env.RAWG_API_KEY;
  if (!key) return null;
  try {
    const term = encodeURIComponent(title);
    const res = await fetch(
      `https://api.rawg.io/api/games?search=${term}&key=${key}&page_size=3`,
      { signal: abortAfter(5000).signal }
    );
    if (!res.ok) return null;
    const data = await res.json();
    const results: { name: string; background_image: string | null }[] =
      data.results ?? [];
    if (!results.length) return null;

    const norm = title.toLowerCase();
    const best =
      results.find((r) => r.name.toLowerCase().includes(norm.slice(0, 15))) ??
      results[0];
    return best.background_image ?? null;
  } catch {
    return null;
  }
}

/** iTunes Search — free, no key. Best for music albums and movies. */
async function fetchItunesImage(
  title: string,
  creator: string,
  entity: string,
  media: string
): Promise<string | null> {
  try {
    const term = encodeURIComponent(`${title} ${creator}`);
    const res = await fetch(
      `https://itunes.apple.com/search?term=${term}&entity=${entity}&media=${media}&limit=3`,
      { signal: abortAfter(5000).signal }
    );
    if (!res.ok) return null;
    const data = await res.json();
    const results: Record<string, string>[] = data.results ?? [];
    if (!results.length) return null;

    const norm = title.toLowerCase();
    const best =
      results.find((r) =>
        (r.trackName ?? r.collectionName ?? "")
          .toLowerCase()
          .includes(norm.slice(0, 15))
      ) ?? results[0];

    const art = best.artworkUrl100;
    if (!art) return null;
    return art.replace("100x100bb", "512x512bb");
  } catch {
    return null;
  }
}

/**
 * Fetch the best cover image for a media item.
 *   GAME  → RAWG (if key set, all platforms) → Steam (free, PC games)
 *   MUSIC → iTunes albums
 *   MOVIE → iTunes movies
 */
async function fetchCoverImage(
  title: string,
  creator: string,
  type: string
): Promise<string | null> {
  if (type === "GAME") {
    const rawg = await fetchRawgImage(title);
    if (rawg) return rawg;
    return fetchSteamImage(title);
  }
  if (type === "MUSIC") {
    return fetchItunesImage(title, creator, "album", "music");
  }
  // MOVIE / default
  return fetchItunesImage(title, creator, "movie", "movie");
}

// ── DB matching ───────────────────────────────────────────────────────────────
function normalise(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9\s]/g, "").trim();
}

async function enrichWithDB(suggestions: AISuggestion[]): Promise<AISuggestion[]> {
  const results: AISuggestion[] = [];

  for (const s of suggestions) {
    if (!s.title || !s.creator) continue;
    if (!["MOVIE", "MUSIC", "GAME"].includes(s.type)) s.type = "GAME";

    // DB match: look for an existing catalog entry with a similar title
    const normTitle = normalise(s.title);
    let matched = await prisma.media.findFirst({
      where: { title: { contains: s.title.substring(0, 20) } },
      select: { id: true, title: true, coverUrl: true },
    });

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

    // Fetch cover art only for items not already in the DB with a cover
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

  // Accept the same env vars as recipe-web for flexibility
  const token =
    process.env.HUGGINGFACE_TOKEN ??
    process.env.HUGGINGFACE_API_KEY ??
    process.env.HF_TOKEN;

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

  const model = process.env.HUGGINGFACE_MODEL ?? DEFAULT_MODEL;

  const instructions =
    "You are a media database assistant. Reply with ONLY a valid JSON array, no markdown, no explanation, no extra text. " +
    'Each item must have these keys: type ("MOVIE"|"MUSIC"|"GAME"), title (string), creator (string), genre (string), releaseYear (number), description (string, max 20 words). ' +
    "Only suggest real, existing works.";

  const input = `Suggest 3 to 5 real media items matching: "${description}"`;

  let raw = "";
  try {
    const hfRes = await fetch(HF_ROUTER, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ model, instructions, input }),
    });

    const hfData = await hfRes.json().catch(() => ({}));
    raw = getOutputText(hfData);

    if (!hfRes.ok) {
      console.error("HuggingFace error:", hfRes.status, JSON.stringify(hfData).slice(0, 400));
      if (hfRes.status === 503) {
        return NextResponse.json(
          { error: "The AI model is warming up — please try again in ~20 seconds.", retryable: true },
          { status: 503 }
        );
      }
      const msg =
        (hfData as { error?: { message?: string } })?.error?.message ??
        (hfData as { message?: string })?.message ??
        `AI service error (${hfRes.status})`;
      return NextResponse.json({ error: msg }, { status: 502 });
    }
  } catch (e) {
    console.error("HuggingFace fetch failed:", e);
    return NextResponse.json({ error: "Failed to reach AI service." }, { status: 502 });
  }

  const suggestions = extractJsonArray(raw);
  if (!suggestions.length) {
    console.warn("Could not parse AI response:", raw.slice(0, 300));
    return NextResponse.json(
      { error: "The AI didn't return usable suggestions. Try a more specific description." },
      { status: 422 }
    );
  }

  const enriched = await enrichWithDB(suggestions.slice(0, 5));
  return NextResponse.json({ suggestions: enriched, model });
}
