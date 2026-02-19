"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type MediaRow = {
  id: string;
  type: string;
  title: string;
  creator: string;
  genre: string | null;
  _count?: { userMedia: number };
};

export default function AdminMediaPage() {
  const [list, setList] = useState<MediaRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  function load() {
    setLoading(true);
    fetch("/api/media")
      .then((r) => r.json())
      .then((data) => setList(Array.isArray(data) ? data : []))
      .catch(() => setList([]))
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, []);

  async function deleteMedia(m: MediaRow) {
    if (!confirm(`Delete "${m.title}"? This cannot be undone.`)) return;
    setDeletingId(m.id);
    try {
      const res = await fetch(`/api/media/${m.id}`, { method: "DELETE" });
      if (res.ok) load();
    } finally {
      setDeletingId(null);
    }
  }

  const typeLabel: Record<string, string> = { MOVIE: "Movie", MUSIC: "Music", GAME: "Game" };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="w-9 h-9 rounded-full border-2 border-[var(--accent)] border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="page-title text-2xl sm:text-3xl text-[var(--foreground)] mb-1">Media catalog</h1>
          <p className="text-[var(--muted)] text-sm">Add, edit, or delete movies, music, and games. Users add these to their collections.</p>
        </div>
        <Link href="/admin/media/new" className="btn btn-primary px-4 py-2.5 rounded-[var(--radius-lg)] text-sm font-semibold">
          Add media
        </Link>
      </div>
      <div className="card rounded-[var(--radius-xl)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--card-border)] bg-[var(--surface)]">
                <th className="text-left px-5 py-3.5 font-semibold text-[var(--foreground)]">Type</th>
                <th className="text-left px-5 py-3.5 font-semibold text-[var(--foreground)]">Title</th>
                <th className="text-left px-5 py-3.5 font-semibold text-[var(--foreground)]">Creator</th>
                <th className="text-left px-5 py-3.5 font-semibold text-[var(--foreground)]">Genre</th>
                <th className="text-right px-5 py-3.5 font-semibold text-[var(--foreground)]">Actions</th>
              </tr>
            </thead>
            <tbody>
              {list.map((m) => (
                <tr key={m.id} className="border-b border-[var(--card-border)] last:border-0 hover:bg-[var(--surface)]/50 transition-colors">
                  <td className="px-5 py-3.5">
                    <span className="text-[var(--muted)]">{typeLabel[m.type] ?? m.type}</span>
                  </td>
                  <td className="px-5 py-3.5">
                    <Link href={`/admin/media/${m.id}`} className="text-[var(--accent)] hover:underline font-medium">
                      {m.title}
                    </Link>
                  </td>
                  <td className="px-5 py-3.5 text-[var(--muted)]">{m.creator}</td>
                  <td className="px-5 py-3.5 text-[var(--muted)]">{m.genre ?? "—"}</td>
                  <td className="px-5 py-3.5 text-right">
                    <span className="inline-flex gap-2">
                      <Link
                        href={`/admin/media/${m.id}`}
                        className="px-3 py-1.5 rounded-[var(--radius)] text-xs font-medium text-[var(--accent)] border border-[var(--accent)]/40 hover:bg-[var(--accent-soft)] transition-colors"
                      >
                        Edit
                      </Link>
                      <button
                        type="button"
                        onClick={() => deleteMedia(m)}
                        disabled={deletingId === m.id}
                        className="px-3 py-1.5 rounded-[var(--radius)] text-xs font-medium text-[var(--danger)] border border-red-200 hover:bg-[var(--danger-soft)] disabled:opacity-50 transition-colors"
                      >
                        {deletingId === m.id ? "…" : "Delete"}
                      </button>
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {list.length === 0 && (
          <p className="px-5 py-10 text-center text-[var(--muted)]">No media. Add items to the catalog.</p>
        )}
      </div>
    </div>
  );
}
