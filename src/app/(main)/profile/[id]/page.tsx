"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

type Item = {
  id: string;
  status: string;
  media: { id: string; type: string; title: string; creator: string; coverUrl: string | null; genre: string | null };
};

type Data = {
  user: { id: string; name: string | null; email: string; image: string | null };
  collection: Item[];
};

const STATUS_LABELS: Record<string, string> = {
  OWNED: "Owned",
  WISHLIST: "Wishlist",
  IN_PROGRESS: "In progress",
  COMPLETED: "Completed",
};

export default function PublicProfilePage() {
  const params = useParams();
  const id = params.id as string;
  const [data, setData] = useState<Data | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/users/${id}/collection`)
      .then((r) => {
        if (!r.ok) throw new Error(r.status === 403 ? "Collection is private" : "Not found");
        return r.json();
      })
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="w-9 h-9 rounded-full border-2 border-[var(--accent)] border-t-transparent animate-spin" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="card rounded-[var(--radius-lg)] p-8 text-center max-w-md">
        <p className="text-[var(--muted)] mb-4">{error || "Profile not found."}</p>
        <Link href="/home" className="text-[var(--accent)] font-semibold hover:underline">← Back to catalog</Link>
      </div>
    );
  }

  const typeEmoji: Record<string, string> = { MOVIE: "🎬", MUSIC: "🎵", GAME: "🎮" };

  return (
    <div>
      <div className="mb-8">
        <h1 className="page-title text-2xl sm:text-3xl text-[var(--foreground)] mb-1">
          {data.user.name || data.user.email}&apos;s collection
        </h1>
        <p className="text-[var(--muted)] text-sm">{data.collection.length} items</p>
      </div>

      {data.collection.length === 0 ? (
        <div className="card rounded-[var(--radius-lg)] p-10 text-center">
          <p className="text-[var(--muted)]">This collection is empty.</p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {data.collection.map((item) => (
            <Link
              key={item.id}
              href={`/media/${item.media.id}`}
              className="card p-4 flex items-center gap-3 rounded-[var(--radius-lg)] hover:shadow-[var(--shadow-hover)] transition-shadow"
            >
              {item.media.coverUrl ? (
                <img src={item.media.coverUrl} alt="" className="w-14 h-20 object-cover rounded bg-[var(--surface)] shrink-0" />
              ) : (
                <div className="w-14 h-20 rounded bg-[var(--surface)] flex items-center justify-center text-2xl shrink-0">{typeEmoji[item.media.type] ?? "📀"}</div>
              )}
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-[var(--foreground)] truncate">{item.media.title}</p>
                <p className="text-sm text-[var(--muted)] truncate">{item.media.creator}</p>
                <span className="inline-block mt-1 px-2 py-0.5 rounded-[var(--radius)] bg-[var(--surface)] text-xs text-[var(--muted)]">
                  {STATUS_LABELS[item.status] ?? item.status}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
