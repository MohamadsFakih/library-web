"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

type Book = {
  id: string;
  title: string;
  author: string;
  isbn: string | null;
  genre: string | null;
  description: string | null;
  coverUrl: string | null;
  totalCopies: number;
  available: number;
};

export default function BookDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [book, setBook] = useState<Book | null>(null);
  const [loading, setLoading] = useState(true);
  const [checkingOut, setCheckingOut] = useState(false);
  const [error, setError] = useState("");

  function load() {
    setLoading(true);
    fetch(`/api/books/${id}`)
      .then((r) => r.json())
      .then((data) => setBook(data))
      .catch(() => setBook(null))
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, [id]);

  async function handleCheckout() {
    if (!book || book.available < 1) return;
    setError("");
    setCheckingOut(true);
    try {
      const res = await fetch("/api/rentals/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookId: book.id }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Failed to check out");
        setCheckingOut(false);
        return;
      }
      router.push("/home/rentals");
      router.refresh();
    } catch {
      setError("Something went wrong.");
      setCheckingOut(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 rounded-full border-2 border-[var(--accent)] border-t-transparent animate-spin" />
      </div>
    );
  }
  if (!book) {
    return (
      <div>
        <p className="text-[var(--muted)]">Book not found.</p>
        <Link href="/home" className="text-[var(--accent)] hover:underline mt-2 inline-block">Back to browse</Link>
      </div>
    );
  }

  return (
    <div className="max-w-2xl">
      <Link href="/home" className="text-sm text-[var(--muted)] hover:text-[var(--foreground)] mb-4 inline-block">
        ← Back to browse
      </Link>
      <div className="card rounded-2xl overflow-hidden flex flex-col sm:flex-row">
        {book.coverUrl ? (
          <img src={book.coverUrl} alt="" className="sm:w-48 h-56 sm:h-auto object-cover bg-[var(--surface)]" />
        ) : (
          <div className="sm:w-48 h-56 sm:h-64 bg-[var(--surface)] flex items-center justify-center text-6xl text-[var(--muted)]">
            📖
          </div>
        )}
        <div className="p-6 flex-1">
          <h1 className="text-2xl font-bold text-[var(--foreground)] mb-1">{book.title}</h1>
          <p className="text-[var(--muted)] mb-2">{book.author}</p>
          {book.genre && <span className="inline-block px-2 py-0.5 rounded-full bg-[var(--surface)] text-xs text-[var(--muted)] mb-2">{book.genre}</span>}
          <p className="text-sm text-[var(--muted)] mb-4">
            {book.available} of {book.totalCopies} copies available
          </p>
          {book.description && <p className="text-sm text-[var(--foreground)]/90 mb-4">{book.description}</p>}
          {error && <p className="text-sm text-red-600 mb-2">{error}</p>}
          <button
            type="button"
            onClick={handleCheckout}
            disabled={book.available < 1 || checkingOut}
            className="btn btn-primary px-4 py-2 rounded-xl text-sm font-semibold"
          >
            {checkingOut ? "Checking out…" : book.available < 1 ? "Not available" : "Borrow this book"}
          </button>
        </div>
      </div>
    </div>
  );
}
