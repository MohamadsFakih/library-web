"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Media = {
  id: string;
  type: string;
  title: string;
  creator: string;
  genre: string | null;
  coverUrl: string | null;
  description: string | null;
  releaseDate: string | null;
  metadata: string | null;
  reason?: string;
  _count?: { userMedia: number };
};

const TYPE_BADGE: Record<string, string> = { MOVIE: "badge-movie", MUSIC: "badge-music", GAME: "badge-game" };
const TYPE_LABEL: Record<string, string> = { MOVIE: "Movie", MUSIC: "Music", GAME: "Game" };
const TYPE_EMOJI: Record<string, string> = { MOVIE: "🎬", MUSIC: "🎵", GAME: "🎮" };

function MediaCard({ m }: { m: Media }) {
  return (
    <Link href={`/media/${m.id}`}
      className="card card-hover block p-0 overflow-hidden rounded-[var(--radius-lg)] group">
      {m.coverUrl ? (
        <div className="w-full h-44 overflow-hidden bg-[var(--surface)]">
          <img src={m.coverUrl} alt={m.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
        </div>
      ) : (
        <div className="w-full h-44 bg-gradient-to-br from-[var(--surface)] to-[var(--card)] flex items-center justify-center text-5xl border-b border-[var(--card-border)]">
          {TYPE_EMOJI[m.type] ?? "📀"}
        </div>
      )}
      <div className="p-4">
        <div className="flex items-center justify-between gap-2 mb-1">
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${TYPE_BADGE[m.type] ?? ""}`}>
            {TYPE_LABEL[m.type] ?? m.type}
          </span>
          {m._count?.userMedia ? (
            <span className="text-[10px] text-[var(--muted)]">{m._count.userMedia} tracking</span>
          ) : null}
        </div>
        <h2 className="font-semibold text-[var(--foreground)] truncate">{m.title}</h2>
        <p className="text-sm text-[var(--muted)] truncate">{m.creator}</p>
        {m.reason && <p className="text-xs text-[var(--accent)] mt-1.5 font-medium line-clamp-1">✨ {m.reason}</p>}
      </div>
    </Link>
  );
}

export default function HomePage() {
  const [media, setMedia] = useState<Media[]>([]);
  const [recommended, setRecommended] = useState<Media[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [typeFilter, setTypeFilter] = useState("");

  function load(query?: string, type?: string) {
    setLoading(true);
    const params = new URLSearchParams();
    if (query) params.set("q", query);
    if (type) params.set("type", type);
    fetch(`/api/media?${params.toString()}`)
      .then((r) => r.json())
      .then((data) => setMedia(Array.isArray(data) ? data : []))
      .catch(() => setMedia([]))
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(undefined, typeFilter || undefined); }, [typeFilter]);

  useEffect(() => {
    fetch("/api/ai/recommend?limit=6")
      .then((r) => r.json())
      .then((data) => setRecommended(Array.isArray(data) ? data : []))
      .catch(() => setRecommended([]));
  }, []);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setQ(searchInput.trim());
    load(searchInput.trim(), typeFilter || undefined);
  }

  const showRecs = recommended.length > 0 && !q && !typeFilter;

  return (
    <div className="animate-fade-in">
      {/* Header row */}
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="page-title text-2xl sm:text-3xl text-[var(--foreground)] mb-1">Browse catalog</h1>
          <p className="text-[var(--muted)] text-sm">Movies, music, and games. Track yours or add new ones.</p>
        </div>
        <Link href="/media/new"
          className="btn btn-primary flex items-center gap-2 px-4 py-2.5 rounded-[var(--radius-lg)] text-sm font-semibold shrink-0">
          <span className="text-base leading-none">+</span> Suggest media
        </Link>
      </div>

      {/* Filters */}
      <form onSubmit={handleSearch} className="flex flex-wrap gap-2 mb-8">
        <input type="search" value={searchInput} onChange={(e) => setSearchInput(e.target.value)}
          placeholder="Search by title, creator…"
          className="form-input flex-1 min-w-[200px] rounded-[var(--radius-lg)] border border-[var(--card-border)] px-4 py-2.5 text-sm" />
        <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}
          className="form-input rounded-[var(--radius-lg)] border border-[var(--card-border)] px-4 py-2.5 text-sm">
          <option value="">All types</option>
          <option value="MOVIE">🎬 Movies</option>
          <option value="MUSIC">🎵 Music</option>
          <option value="GAME">🎮 Games</option>
        </select>
        <button type="submit" className="btn btn-primary px-5 py-2.5 rounded-[var(--radius-lg)] text-sm font-semibold shrink-0">Search</button>
      </form>

      {/* Recommendations */}
      {showRecs && (
        <section className="mb-10">
          <h2 className="font-display text-lg font-bold text-[var(--foreground)] mb-4 flex items-center gap-2">
            <span className="w-1 h-5 rounded-full bg-gradient-to-b from-[var(--accent)] to-[var(--accent-hover)]" />
            Recommended for you
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {recommended.map((m) => <MediaCard key={m.id} m={m} />)}
          </div>
        </section>
      )}

      {/* All catalog */}
      {(!q && !typeFilter) && (
        <h2 className="font-display text-lg font-bold text-[var(--foreground)] mb-4 flex items-center gap-2">
          <span className="w-1 h-5 rounded-full bg-gradient-to-b from-[var(--accent)] to-[var(--accent-hover)]" />
          {showRecs ? "All catalog" : "Catalog"}
        </h2>
      )}
      {q && (
        <p className="text-sm text-[var(--muted)] mb-4">Results for &ldquo;{q}&rdquo;</p>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-9 h-9 rounded-full border-2 border-[var(--accent)] border-t-transparent animate-spin" />
        </div>
      ) : media.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {media.map((m) => <MediaCard key={m.id} m={m} />)}
        </div>
      ) : (
        <div className="card rounded-[var(--radius-xl)] p-12 text-center">
          <div className="text-4xl mb-3">🔍</div>
          <p className="text-[var(--muted)] mb-4">{q || typeFilter ? "No matches found. Try different filters." : "No media in the catalog yet."}</p>
          <Link href="/media/new" className="text-[var(--accent)] font-semibold hover:underline text-sm">+ Suggest the first one</Link>
        </div>
      )}
    </div>
  );
}
