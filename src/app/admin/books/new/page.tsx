"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminNewBookPage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [isbn, setIsbn] = useState("");
  const [genre, setGenre] = useState("");
  const [description, setDescription] = useState("");
  const [totalCopies, setTotalCopies] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/books", {
        method: "POST",
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
        setError(data.error ?? "Failed to create book");
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

  return (
    <div>
      <h1 className="text-2xl font-bold text-[var(--foreground)] mb-1">Add book</h1>
      <p className="text-[var(--muted)] text-sm mb-6">Create a new book in the catalog.</p>

      <form onSubmit={handleSubmit} className="max-w-lg space-y-4">
        {error && (
          <div className="rounded-xl bg-[var(--danger-soft)] border border-red-200 text-red-700 px-4 py-3 text-sm">
            {error}
          </div>
        )}
        <div>
          <label className="block text-sm font-medium text-[var(--foreground)] mb-1">Title *</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            className="form-input w-full rounded-xl border border-[var(--card-border)] bg-[var(--card)] px-4 py-3 text-sm"
            placeholder="Book title"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-[var(--foreground)] mb-1">Author *</label>
          <input
            type="text"
            value={author}
            onChange={(e) => setAuthor(e.target.value)}
            required
            className="form-input w-full rounded-xl border border-[var(--card-border)] bg-[var(--card)] px-4 py-3 text-sm"
            placeholder="Author name"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-[var(--foreground)] mb-1">ISBN (optional)</label>
          <input
            type="text"
            value={isbn}
            onChange={(e) => setIsbn(e.target.value)}
            className="form-input w-full rounded-xl border border-[var(--card-border)] bg-[var(--card)] px-4 py-3 text-sm"
            placeholder="ISBN"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-[var(--foreground)] mb-1">Genre (optional)</label>
          <input
            type="text"
            value={genre}
            onChange={(e) => setGenre(e.target.value)}
            className="form-input w-full rounded-xl border border-[var(--card-border)] bg-[var(--card)] px-4 py-3 text-sm"
            placeholder="Fiction, Non-fiction, etc."
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-[var(--foreground)] mb-1">Description (optional)</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="form-input w-full rounded-xl border border-[var(--card-border)] bg-[var(--card)] px-4 py-3 text-sm"
            placeholder="Brief description"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-[var(--foreground)] mb-1">Total copies *</label>
          <input
            type="number"
            min={1}
            value={totalCopies}
            onChange={(e) => setTotalCopies(parseInt(e.target.value, 10) || 1)}
            className="form-input w-full rounded-xl border border-[var(--card-border)] bg-[var(--card)] px-4 py-3 text-sm"
          />
        </div>
        <div className="flex gap-3 pt-2">
          <button type="submit" disabled={loading} className="btn btn-primary px-4 py-2 rounded-xl text-sm font-semibold">
            {loading ? "Creating…" : "Create book"}
          </button>
          <button type="button" onClick={() => router.back()} className="btn btn-outline px-4 py-2 rounded-xl text-sm font-semibold">
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
