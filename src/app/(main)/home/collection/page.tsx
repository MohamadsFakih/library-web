"use client";

import { useEffect, useState } from "react";
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
  OWNED: "Owned",
  WISHLIST: "Wishlist",
  IN_PROGRESS: "In progress",
  COMPLETED: "Completed",
};
const STATUS_CLASS: Record<string, string> = {
  OWNED: "status-owned",
  WISHLIST: "status-wishlist",
  IN_PROGRESS: "status-progress",
  COMPLETED: "status-completed",
};

export default function MyCollectionPage() {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  function load() {
    setLoading(true);
    const params = statusFilter ? `?status=${statusFilter}` : "";
    fetch(`/api/collection${params}`)
      .then((r) => r.json())
      .then((data) => setItems(Array.isArray(data) ? data : []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
  }, [statusFilter]);

  async function updateStatus(itemId: string, status: string) {
    setUpdatingId(itemId);
    try {
      const res = await fetch(`/api/collection/${itemId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (res.ok) load();
    } finally {
      setUpdatingId(null);
    }
  }

  async function remove(itemId: string) {
    if (!confirm("Remove from your collection?")) return;
    try {
      const res = await fetch(`/api/collection/${itemId}`, { method: "DELETE" });
      if (res.ok) load();
    } catch {}
  }

  const typeEmoji: Record<string, string> = { MOVIE: "🎬", MUSIC: "🎵", GAME: "🎮" };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="w-9 h-9 rounded-full border-2 border-[var(--accent)] border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="page-title text-2xl sm:text-3xl text-[var(--foreground)] mb-2">My collection</h1>
        <p className="text-[var(--muted)] text-sm">Track what you own, wishlist, are using, or have completed.</p>
      </div>

      <div className="flex flex-wrap gap-2 mb-6">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="form-input rounded-[var(--radius-lg)] border border-[var(--card-border)] bg-[var(--card)] px-4 py-2.5 text-sm"
        >
          <option value="">All statuses</option>
          {Object.entries(STATUS_LABELS).map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
      </div>

      {items.length === 0 ? (
        <div className="card rounded-[var(--radius-lg)] p-10 text-center">
          <p className="text-[var(--muted)] mb-3">Your collection is empty.</p>
          <Link href="/home" className="text-[var(--accent)] font-semibold hover:underline">Browse catalog</Link>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <div key={item.id} className="card p-4 flex flex-wrap items-center gap-4 rounded-[var(--radius-lg)]">
              {item.media.coverUrl ? (
                <img src={item.media.coverUrl} alt="" className="w-16 h-24 object-cover rounded-[var(--radius)] bg-[var(--surface)] shrink-0" />
              ) : (
                <div className="w-16 h-24 rounded-[var(--radius)] bg-[var(--surface)] flex items-center justify-center text-2xl shrink-0">
                  {typeEmoji[item.media.type] ?? "📀"}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <Link href={`/media/${item.media.id}`} className="font-semibold text-[var(--foreground)] hover:text-[var(--accent)] truncate block transition-colors">
                  {item.media.title}
                </Link>
                <p className="text-sm text-[var(--muted)]">{item.media.creator}</p>
                <span className={`inline-block mt-1 px-2 py-0.5 rounded-full text-xs font-semibold ${STATUS_CLASS[item.status] ?? "bg-[var(--surface)] text-[var(--muted)]"}`}>
                  {STATUS_LABELS[item.status] ?? item.status}
                </span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <select
                  value={item.status}
                  onChange={(e) => updateStatus(item.id, e.target.value)}
                  disabled={updatingId === item.id}
                  className="form-input rounded-[var(--radius)] border border-[var(--card-border)] bg-[var(--card)] px-3 py-1.5 text-sm"
                >
                  {Object.entries(STATUS_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => remove(item.id)}
                  className="text-sm text-[var(--muted)] hover:text-[var(--danger)] px-2"
                  title="Remove from collection"
                >
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
