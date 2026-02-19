"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
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
  available?: number;
};

export default function AdminEditBookPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const [book, setBook] = useState<Book | null>(null);
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [isbn, setIsbn] = useState("");
  const [genre, setGenre] = useState("");
  const [description, setDescription] = useState("");
  const [totalCopies, setTotalCopies] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [loadingBook, setLoadingBook] = useState(true);

  useEffect(() => {
    fetch(`/api/books/${id}`)
      .then((r) => r.json())
      .then((data) => {
        setBook(data);
        setTitle(data.title ?? "");
        setAuthor(data.author ?? "");
        setIsbn(data.isbn ?? "");
        setGenre(data.genre ?? "");
        setDescription(data.description ?? "");
        setTotalCopies(data.totalCopies ?? 1);
      })
      .catch(() => setBook(null))
      .finally(() => setLoadingBook(false));
  }, [id]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch(`/api/books/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          author,
          isbn: isbn || undefined,
          genre: genre || undefined,
          description: description || undefined,
          totalCopies,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Failed to update book");
        setLoading(false);
        return;
      }
      router.push("/admin/books");
      router.refresh();
    } catch {
      setError("Something went wrong.");
      setLoading(false);
    }
  }

  if (loadingBook) {
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
        <Link href="/admin/books" className="text-[var(--accent)] hover:underline mt-2 inline-block">Back to books</Link>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-[var(--foreground)] mb-1">Edit book</h1>
      <p className="text-[var(--muted)] text-sm mb-6">{book.title}</p>

      <form onSubmit={handleSubmit} className="max-w-lg space-y-4">
        {error && (
          <div className="rounded-xl bg-[var(--danger-soft)] border border-red-200 text-red-700 px-4 py-3 text-sm">
            {error}
          </div>
        )}
        <div>
          <label className="block text-sm font-medium text-[var(--foreground)] mb-1">Title *</label>
          <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} required className="form-input w-full rounded-xl border border-[var(--card-border)] bg-[var(--card)] px-4 py-3 text-sm" />
        </div>
        <div>
          <label className="block text-sm font-medium text-[var(--foreground)] mb-1">Author *</label>
          <input type="text" value={author} onChange={(e) => setAuthor(e.target.value)} required className="form-input w-full rounded-xl border border-[var(--card-border)] bg-[var(--card)] px-4 py-3 text-sm" />
        </div>
        <div>
          <label className="block text-sm font-medium text-[var(--foreground)] mb-1">ISBN</label>
          <input type="text" value={isbn} onChange={(e) => setIsbn(e.target.value)} className="form-input w-full rounded-xl border border-[var(--card-border)] bg-[var(--card)] px-4 py-3 text-sm" />
        </div>
        <div>
          <label className="block text-sm font-medium text-[var(--foreground)] mb-1">Genre</label>
          <input type="text" value={genre} onChange={(e) => setGenre(e.target.value)} className="form-input w-full rounded-xl border border-[var(--card-border)] bg-[var(--card)] px-4 py-3 text-sm" />
        </div>
        <div>
          <label className="block text-sm font-medium text-[var(--foreground)] mb-1">Description</label>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} className="form-input w-full rounded-xl border border-[var(--card-border)] bg-[var(--card)] px-4 py-3 text-sm" />
        </div>
        <div>
          <label className="block text-sm font-medium text-[var(--foreground)] mb-1">Total copies *</label>
          <input type="number" min={1} value={totalCopies} onChange={(e) => setTotalCopies(parseInt(e.target.value, 10) || 1)} className="form-input w-full rounded-xl border border-[var(--card-border)] bg-[var(--card)] px-4 py-3 text-sm" />
        </div>
        <div className="flex gap-3 pt-2">
          <button type="submit" disabled={loading} className="btn btn-primary px-4 py-2 rounded-xl text-sm font-semibold">
            {loading ? "Saving…" : "Save"}
          </button>
          <Link href="/admin/books" className="btn btn-outline px-4 py-2 rounded-xl text-sm font-semibold inline-block">
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
