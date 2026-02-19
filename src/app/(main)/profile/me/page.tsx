"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Item = {
  id: string;
  status: string;
  media: { id: string; type: string; title: string; creator: string; coverUrl: string | null };
};

type User = {
  id: string;
  email: string;
  name: string | null;
  profilePublic: boolean;
};

const STATUS_LABELS: Record<string, string> = {
  OWNED: "Owned",
  WISHLIST: "Wishlist",
  IN_PROGRESS: "In progress",
  COMPLETED: "Completed",
};

export default function MyProfilePage() {
  const [user, setUser] = useState<User | null>(null);
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState("");
  const [profilePublic, setProfilePublic] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/me").then((r) => r.json()),
      fetch("/api/collection").then((r) => r.json()),
    ])
      .then(([userData, collectionData]) => {
        setUser(userData);
        setName(userData.name ?? "");
        setProfilePublic(userData.profilePublic ?? true);
        setItems(Array.isArray(collectionData) ? collectionData : []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function saveProfile() {
    setSaving(true);
    try {
      const res = await fetch("/api/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, profilePublic }),
      });
      if (res.ok) {
        const data = await res.json();
        setUser(data);
      }
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="w-9 h-9 rounded-full border-2 border-[var(--accent)] border-t-transparent animate-spin" />
      </div>
    );
  }

  const typeEmoji: Record<string, string> = { MOVIE: "🎬", MUSIC: "🎵", GAME: "🎮" };

  return (
    <div>
      <div className="mb-8">
        <h1 className="page-title text-2xl sm:text-3xl text-[var(--foreground)] mb-2">My profile</h1>
        <p className="text-[var(--muted)] text-sm">Your collection is {user?.profilePublic ? "public" : "private"}. Others can see what you track when it&apos;s public.</p>
      </div>

      <div className="card rounded-[var(--radius-lg)] p-6 mb-8 max-w-lg">
        <h2 className="font-semibold text-[var(--foreground)] mb-4">Profile settings</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[var(--foreground)] mb-1.5">Display name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="form-input w-full rounded-[var(--radius-lg)] border border-[var(--card-border)] bg-[var(--card)] px-4 py-3 text-sm"
              placeholder="Your name"
            />
          </div>
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={profilePublic}
              onChange={(e) => setProfilePublic(e.target.checked)}
              className="rounded border-[var(--card-border)]"
            />
            <span className="text-sm font-medium text-[var(--foreground)]">Share my collection publicly</span>
          </label>
          <button
            type="button"
            onClick={saveProfile}
            disabled={saving}
            className="btn btn-primary px-4 py-2 rounded-[var(--radius-lg)] text-sm font-semibold"
          >
            {saving ? "Saving…" : "Save"}
          </button>
        </div>
        {user?.profilePublic && (
          <p className="mt-4 text-sm text-[var(--muted)]">
            Your public profile: <Link href={`/profile/${user.id}`} className="text-[var(--accent)] hover:underline">View as others see it</Link>
          </p>
        )}
      </div>

      <h2 className="font-display text-lg font-semibold text-[var(--foreground)] mb-4">Your collection ({items.length})</h2>
      {items.length === 0 ? (
        <p className="text-[var(--muted)]">No items yet. <Link href="/home" className="text-[var(--accent)] hover:underline">Browse catalog</Link></p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {items.slice(0, 12).map((item) => (
            <Link
              key={item.id}
              href={`/media/${item.media.id}`}
              className="card p-3 flex items-center gap-3 rounded-[var(--radius-lg)] hover:shadow-[var(--shadow-hover)] transition-shadow"
            >
              {item.media.coverUrl ? (
                <img src={item.media.coverUrl} alt="" className="w-12 h-16 object-cover rounded bg-[var(--surface)] shrink-0" />
              ) : (
                <div className="w-12 h-16 rounded bg-[var(--surface)] flex items-center justify-center text-xl shrink-0">{typeEmoji[item.media.type] ?? "📀"}</div>
              )}
              <div className="min-w-0">
                <p className="font-medium text-[var(--foreground)] truncate">{item.media.title}</p>
                <p className="text-xs text-[var(--muted)]">{STATUS_LABELS[item.status] ?? item.status}</p>
              </div>
            </Link>
          ))}
        </div>
      )}
      {items.length > 12 && (
        <Link href="/home/collection" className="inline-block mt-4 text-sm text-[var(--accent)] font-medium hover:underline">View all in My collection →</Link>
      )}
    </div>
  );
}
