"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

type Item = {
  id: string;
  status: string;
  notes: string | null;
  addedAt: string;
  completedAt: string | null;
  media: {
    id: string;
    type: string;
    title: string;
    creator: string;
    coverUrl: string | null;
    genre: string | null;
  };
};

const STATUS_LABELS: Record<string, string> = {
  OWNED: "Owned", WISHLIST: "Wishlist",
  IN_PROGRESS: "In progress", COMPLETED: "Completed",
};
const STATUS_CLASS: Record<string, string> = {
  OWNED: "status-owned", WISHLIST: "status-wishlist",
  IN_PROGRESS: "status-progress", COMPLETED: "status-completed",
};
const TYPE_EMOJI: Record<string, string> = { MOVIE: "🎬", MUSIC: "🎵", GAME: "🎮" };
const TYPE_BADGE: Record<string, string> = { MOVIE: "badge-movie", MUSIC: "badge-music", GAME: "badge-game" };

export default function MyCollectionPage() {
  const [allItems, setAllItems]   = useState<Item[]>([]);
  const [loading, setLoading]     = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  // Filters
  const [search, setSearch]         = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  function load() {
    setLoading(true);
    fetch("/api/collection")
      .then((r) => r.json())
      .then((data) => setAllItems(Array.isArray(data) ? data : []))
      .catch(() => setAllItems([]))
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, []);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setSearch(searchInput.trim());
  }

  // Client-side filtering — instant, no extra fetches
  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return allItems.filter((item) => {
      if (typeFilter   && item.media.type !== typeFilter) return false;
      if (statusFilter && item.status !== statusFilter) return false;
      if (q && !item.media.title.toLowerCase().includes(q)
            && !item.media.creator.toLowerCase().includes(q)
            && !(item.media.genre ?? "").toLowerCase().includes(q)) return false;
      return true;
    });
  }, [allItems, search, typeFilter, statusFilter]);

  async function updateStatus(itemId: string, status: string) {
    setUpdatingId(itemId);
    try {
      const res = await fetch(`/api/collection/${itemId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (res.ok) setAllItems((prev) => prev.map((i) => i.id === itemId ? { ...i, status } : i));
    } finally { setUpdatingId(null); }
  }

  async function remove(itemId: string) {
    if (!confirm("Remove from your collection?")) return;
    const res = await fetch(`/api/collection/${itemId}`, { method: "DELETE" });
    if (res.ok) setAllItems((prev) => prev.filter((i) => i.id !== itemId));
  }

  const hasFilters = search || typeFilter || statusFilter;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="w-9 h-9 rounded-full border-2 border-[var(--accent)] border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="page-title text-2xl sm:text-3xl text-[var(--foreground)] mb-1">My collection</h1>
          <p className="text-[var(--muted)] text-sm">
            {allItems.length} item{allItems.length !== 1 ? "s" : ""}
            {hasFilters && filtered.length !== allItems.length
              ? ` · ${filtered.length} shown`
              : ""}
          </p>
        </div>
        <Link href="/home" className="btn btn-outline px-3.5 py-2 rounded-[var(--radius-lg)] text-sm font-medium shrink-0">
          Browse catalog
        </Link>
      </div>

      {/* Filters */}
      <form onSubmit={handleSearch} className="flex flex-wrap gap-2 mb-6">
        <input
          type="search"
          value={searchInput}
          onChange={(e) => { setSearchInput(e.target.value); if (!e.target.value) setSearch(""); }}
          placeholder="Search by title, creator, genre…"
          className="form-input flex-1 min-w-[200px] rounded-[var(--radius-lg)] border border-[var(--card-border)] px-4 py-2.5 text-sm"
        />
        <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}
          className="form-input rounded-[var(--radius-lg)] border border-[var(--card-border)] px-4 py-2.5 text-sm">
          <option value="">All types</option>
          <option value="MOVIE">🎬 Movies</option>
          <option value="MUSIC">🎵 Music</option>
          <option value="GAME">🎮 Games</option>
        </select>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
          className="form-input rounded-[var(--radius-lg)] border border-[var(--card-border)] px-4 py-2.5 text-sm">
          <option value="">All statuses</option>
          {Object.entries(STATUS_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
        <button type="submit" className="btn btn-primary px-5 py-2.5 rounded-[var(--radius-lg)] text-sm font-semibold shrink-0">
          Search
        </button>
        {hasFilters && (
          <button type="button"
            onClick={() => { setSearch(""); setSearchInput(""); setTypeFilter(""); setStatusFilter(""); }}
            className="btn btn-outline px-3.5 py-2.5 rounded-[var(--radius-lg)] text-sm font-medium shrink-0 text-[var(--muted)]">
            Clear
          </button>
        )}
      </form>

      {/* Results */}
      {filtered.length === 0 ? (
        <div className="card rounded-[var(--radius-xl)] p-12 text-center">
          <div className="text-4xl mb-3">{allItems.length === 0 ? "📭" : "🔍"}</div>
          <p className="text-[var(--muted)] mb-4 text-sm">
            {allItems.length === 0
              ? "Your collection is empty."
              : "No items match your filters."}
          </p>
          {allItems.length === 0
            ? <Link href="/home" className="text-[var(--accent)] font-semibold hover:underline text-sm">Browse catalog</Link>
            : <button type="button" onClick={() => { setSearch(""); setSearchInput(""); setTypeFilter(""); setStatusFilter(""); }}
                className="text-[var(--accent)] font-semibold hover:underline text-sm">Clear filters</button>
          }
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((item) => (
            <div key={item.id} className="card p-4 flex items-center gap-4 rounded-[var(--radius-lg)] card-hover">
              {/* Cover */}
              {item.media.coverUrl ? (
                <img src={item.media.coverUrl} alt="" className="w-12 h-16 object-cover rounded-[var(--radius)] bg-[var(--surface)] shrink-0" />
              ) : (
                <div className="w-12 h-16 rounded-[var(--radius)] bg-[var(--surface)] flex items-center justify-center text-xl shrink-0">
                  {TYPE_EMOJI[item.media.type] ?? "📀"}
                </div>
              )}

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${TYPE_BADGE[item.media.type] ?? ""}`}>
                    {item.media.type}
                  </span>
                  {item.media.genre && (
                    <span className="text-[10px] text-[var(--muted)]">{item.media.genre}</span>
                  )}
                </div>
                <Link href={`/media/${item.media.id}`}
                  className="font-semibold text-sm text-[var(--foreground)] hover:text-[var(--accent)] truncate block transition-colors">
                  {item.media.title}
                </Link>
                <p className="text-xs text-[var(--muted)] truncate">{item.media.creator}</p>
              </div>

              {/* Status badge + controls */}
              <div className="flex items-center gap-2 shrink-0 flex-wrap justify-end">
                <span className={`text-[10px] font-bold px-2 py-1 rounded-full hidden sm:inline-block ${STATUS_CLASS[item.status] ?? ""}`}>
                  {STATUS_LABELS[item.status] ?? item.status}
                </span>
                <select value={item.status} onChange={(e) => updateStatus(item.id, e.target.value)}
                  disabled={updatingId === item.id}
                  className="form-input rounded-[var(--radius)] border border-[var(--card-border)] px-3 py-1.5 text-xs">
                  {Object.entries(STATUS_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
                <button type="button" onClick={() => remove(item.id)}
                  className="text-xs text-[var(--muted)] hover:text-[var(--danger)] transition-colors px-1 py-1">
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
