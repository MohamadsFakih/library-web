"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Book = {
  id: string;
  title: string;
  author: string;
  genre: string | null;
  coverUrl: string | null;
  available: number;
  totalCopies: number;
  reason?: string;
};

export default function HomePage() {
  const [books, setBooks] = useState<Book[]>([]);
  const [recommended, setRecommended] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [searchInput, setSearchInput] = useState("");

  function load(query?: string) {
    setLoading(true);
    const url = query != null ? `/api/books/search?q=${encodeURIComponent(query)}` : "/api/books";
    fetch(url)
      .then((r) => r.json())
      .then((data) => setBooks(Array.isArray(data) ? data : []))
      .catch(() => setBooks([]))
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, []);

  useEffect(() => {
    fetch("/api/ai/recommend")
      .then((r) => r.json())
      .then((data) => setRecommended(Array.isArray(data) ? data : []))
      .catch(() => setRecommended([]));
  }, []);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    load(searchInput.trim());
    setQ(searchInput.trim());
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-[var(--foreground)] mb-2">Browse books</h1>
      <p className="text-[var(--muted)] text-sm mb-6">Search by title, author, or description.</p>

      <form onSubmit={handleSearch} className="flex gap-2 mb-6 max-w-md">
        <input
          type="search"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="Search books…"
          className="form-input flex-1 rounded-xl border border-[var(--card-border)] bg-[var(--card)] px-4 py-3 text-sm"
        />
        <button type="submit" className="btn btn-primary px-4 py-3 rounded-xl text-sm font-semibold">
          Search
        </button>
      </form>

      {recommended.length > 0 && !q && (
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-[var(--foreground)] mb-3">Recommended for you</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {recommended.slice(0, 6).map((b) => (
              <Link
                key={b.id}
                href={`/books/${b.id}`}
                className="card block p-4 rounded-xl hover:shadow-[var(--shadow-hover)] transition-shadow"
              >
                {b.coverUrl ? (
                  <img src={b.coverUrl} alt="" className="w-full h-40 object-cover rounded-lg mb-3 bg-[var(--surface)]" />
                ) : (
                  <div className="w-full h-40 rounded-lg bg-[var(--surface)] flex items-center justify-center mb-3 text-[var(--muted)] text-4xl">📖</div>
                )}
                <h3 className="font-semibold text-[var(--foreground)] truncate">{b.title}</h3>
                <p className="text-sm text-[var(--muted)] truncate">{b.author}</p>
                {b.reason && <p className="text-xs text-[var(--muted)] mt-1">{b.reason}</p>}
              </Link>
            ))}
          </div>
        </div>
      )}

      {!q && recommended.length > 0 && <h2 className="text-lg font-semibold text-[var(--foreground)] mb-3">All books</h2>}

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 rounded-full border-2 border-[var(--accent)] border-t-transparent animate-spin" />
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {books.map((b) => (
            <Link
              key={b.id}
              href={`/books/${b.id}`}
              className="card block p-4 rounded-xl hover:shadow-[var(--shadow-hover)] transition-shadow"
            >
              {b.coverUrl ? (
                <img src={b.coverUrl} alt="" className="w-full h-40 object-cover rounded-lg mb-3 bg-[var(--surface)]" />
              ) : (
                <div className="w-full h-40 rounded-lg bg-[var(--surface)] flex items-center justify-center mb-3 text-[var(--muted)] text-4xl">
                  📖
                </div>
              )}
              <h2 className="font-semibold text-[var(--foreground)] truncate">{b.title}</h2>
              <p className="text-sm text-[var(--muted)] truncate">{b.author}</p>
              <p className="text-xs text-[var(--muted)] mt-1">
                {b.available} of {b.totalCopies} available
              </p>
            </Link>
          ))}
        </div>
      )}
      {!loading && books.length === 0 && (
        <p className="text-[var(--muted)] py-8">No books found. {q ? "Try a different search." : "The catalog is empty."}</p>
      )}
    </div>
  );
}
