"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Rental = {
  id: string;
  borrowedAt: string;
  dueAt: string | null;
  returnedAt: string | null;
  book: { id: string; title: string; author: string; coverUrl: string | null };
};

export default function MyRentalsPage() {
  const [rentals, setRentals] = useState<Rental[]>([]);
  const [loading, setLoading] = useState(true);
  const [returningId, setReturningId] = useState<string | null>(null);

  function load() {
    setLoading(true);
    fetch("/api/rentals")
      .then((r) => r.json())
      .then((data) => setRentals(Array.isArray(data) ? data : []))
      .catch(() => setRentals([]))
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, []);

  async function handleReturn(rentalId: string) {
    setReturningId(rentalId);
    try {
      const res = await fetch("/api/rentals/return", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rentalId }),
      });
      if (res.ok) load();
    } finally {
      setReturningId(null);
    }
  }

  const active = rentals.filter((r) => !r.returnedAt);
  const past = rentals.filter((r) => r.returnedAt);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 rounded-full border-2 border-[var(--accent)] border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-[var(--foreground)] mb-2">My rentals</h1>
      <p className="text-[var(--muted)] text-sm mb-6">Books you have borrowed. Return when done.</p>

      {active.length > 0 && (
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-[var(--foreground)] mb-3">Currently borrowed</h2>
          <div className="space-y-3">
            {active.map((r) => (
              <div key={r.id} className="card p-4 flex items-center gap-4 rounded-xl">
                {r.book.coverUrl ? (
                  <img src={r.book.coverUrl} alt="" className="w-14 h-20 object-cover rounded bg-[var(--surface)]" />
                ) : (
                  <div className="w-14 h-20 rounded bg-[var(--surface)] flex items-center justify-center text-2xl text-[var(--muted)]">📖</div>
                )}
                <div className="flex-1 min-w-0">
                  <Link href={`/books/${r.book.id}`} className="font-medium text-[var(--foreground)] hover:text-[var(--accent)] truncate block">
                    {r.book.title}
                  </Link>
                  <p className="text-sm text-[var(--muted)]">{r.book.author}</p>
                  <p className="text-xs text-[var(--muted)]">
                    Borrowed {new Date(r.borrowedAt).toLocaleDateString()}
                    {r.dueAt && ` · Due ${new Date(r.dueAt).toLocaleDateString()}`}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleReturn(r.id)}
                  disabled={returningId === r.id}
                  className="btn btn-primary px-4 py-2 rounded-xl text-sm font-semibold shrink-0"
                >
                  {returningId === r.id ? "Returning…" : "Return book"}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {past.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-[var(--foreground)] mb-3">Past rentals</h2>
          <div className="space-y-3">
            {past.map((r) => (
              <div key={r.id} className="card p-4 flex items-center gap-4 rounded-xl opacity-80">
                {r.book.coverUrl ? (
                  <img src={r.book.coverUrl} alt="" className="w-14 h-20 object-cover rounded bg-[var(--surface)]" />
                ) : (
                  <div className="w-14 h-20 rounded bg-[var(--surface)] flex items-center justify-center text-2xl text-[var(--muted)]">📖</div>
                )}
                <div className="flex-1 min-w-0">
                  <Link href={`/books/${r.book.id}`} className="font-medium text-[var(--foreground)] hover:text-[var(--accent)] truncate block">
                    {r.book.title}
                  </Link>
                  <p className="text-sm text-[var(--muted)]">{r.book.author}</p>
                  <p className="text-xs text-[var(--muted)]">
                    Returned {r.returnedAt ? new Date(r.returnedAt).toLocaleDateString() : "—"}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {rentals.length === 0 && (
        <p className="text-[var(--muted)] py-8">You haven&apos;t borrowed any books yet. <Link href="/home" className="text-[var(--accent)] hover:underline">Browse the catalog</Link>.</p>
      )}
    </div>
  );
}
