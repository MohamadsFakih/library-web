"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type BookRow = {
  id: string;
  title: string;
  author: string;
  genre: string | null;
  totalCopies: number;
  available?: number;
};

export default function AdminBooksPage() {
  const [books, setBooks] = useState<BookRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  function load() {
    setLoading(true);
    fetch("/api/books")
      .then((r) => r.json())
      .then((data) => setBooks(Array.isArray(data) ? data : []))
      .catch(() => setBooks([]))
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, []);

  async function deleteBook(b: BookRow) {
    if (!confirm(`Delete "${b.title}"? This cannot be undone.`)) return;
    setDeletingId(b.id);
    try {
      const res = await fetch(`/api/books/${b.id}`, { method: "DELETE" });
      if (res.ok) load();
    } finally {
      setDeletingId(null);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 rounded-full border-2 border-[var(--accent)] border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[var(--foreground)] mb-1">Books</h1>
          <p className="text-[var(--muted)] text-sm">Manage catalog. Add, edit, or delete books.</p>
        </div>
        <Link
          href="/admin/books/new"
          className="btn btn-primary px-4 py-2 rounded-xl text-sm font-semibold"
        >
          Add book
        </Link>
      </div>
      <div className="rounded-2xl border border-[var(--card-border)] bg-[var(--card)] overflow-hidden shadow-[var(--shadow-card)]">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--card-border)] bg-[var(--surface)]">
                <th className="text-left px-4 py-3 font-semibold text-[var(--foreground)]">Title</th>
                <th className="text-left px-4 py-3 font-semibold text-[var(--foreground)]">Author</th>
                <th className="text-left px-4 py-3 font-semibold text-[var(--foreground)]">Genre</th>
                <th className="text-left px-4 py-3 font-semibold text-[var(--foreground)]">Copies / Available</th>
                <th className="text-right px-4 py-3 font-semibold text-[var(--foreground)]">Actions</th>
              </tr>
            </thead>
            <tbody>
              {books.map((b) => (
                <tr key={b.id} className="border-b border-[var(--card-border)]">
                  <td className="px-4 py-3">
                    <Link href={`/admin/books/${b.id}`} className="text-[var(--accent)] hover:underline font-medium">
                      {b.title}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-[var(--muted)]">{b.author}</td>
                  <td className="px-4 py-3 text-[var(--muted)]">{b.genre ?? "—"}</td>
                  <td className="px-4 py-3 text-[var(--muted)]">{b.totalCopies} / {b.available ?? b.totalCopies}</td>
                  <td className="px-4 py-3 text-right flex gap-2 justify-end">
                    <Link href={`/admin/books/${b.id}`} className="px-3 py-1.5 rounded-lg text-xs text-[var(--accent)] border border-[var(--accent)]/40 hover:bg-[var(--accent-soft)]">
                      Edit
                    </Link>
                    <button
                      type="button"
                      onClick={() => deleteBook(b)}
                      disabled={deletingId === b.id}
                      className="px-3 py-1.5 rounded-lg text-xs text-red-600 border border-red-200 hover:bg-red-50 disabled:opacity-50"
                    >
                      {deletingId === b.id ? "…" : "Delete"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {books.length === 0 && (
          <p className="px-4 py-8 text-center text-[var(--muted)]">No books. Add one to get started.</p>
        )}
      </div>
    </div>
  );
}
