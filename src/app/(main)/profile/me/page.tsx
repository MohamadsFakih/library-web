"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type CollectionItem = {
  id: string;
  status: string;
  media: { id: string; type: string; title: string; creator: string; coverUrl: string | null };
};

type Suggestion = {
  id: string;
  type: string;
  title: string;
  creator: string;
  coverUrl: string | null;
  status: string; // PENDING | APPROVED | REJECTED
  rejectionNote: string | null;
  createdAt: string;
};

type User = {
  id: string;
  email: string;
  name: string | null;
  profilePublic: boolean;
};

const STATUS_LABELS: Record<string, string> = {
  OWNED: "Owned", WISHLIST: "Wishlist",
  IN_PROGRESS: "In progress", COMPLETED: "Completed",
};
const STATUS_CLASS: Record<string, string> = {
  OWNED: "status-owned", WISHLIST: "status-wishlist",
  IN_PROGRESS: "status-progress", COMPLETED: "status-completed",
};
const TYPE_EMOJI: Record<string, string> = { MOVIE: "🎬", MUSIC: "🎵", GAME: "🎮" };
const TYPE_BADGE: Record<string, string> = { MOVIE: "badge-movie", MUSIC: "badge-music", GAME: "badge-game" };

const SUGGESTION_STATUS: Record<string, { label: string; cls: string; icon: string }> = {
  PENDING:  { label: "Pending review", cls: "bg-[rgba(251,191,36,0.12)] text-[#fbbf24] border border-[rgba(251,191,36,0.25)]", icon: "⏳" },
  APPROVED: { label: "Approved",       cls: "bg-[rgba(52,211,153,0.12)] text-[#34d399] border border-[rgba(52,211,153,0.25)]", icon: "✅" },
  REJECTED: { label: "Rejected",       cls: "bg-[rgba(244,63,94,0.12)]  text-[#f43f5e] border border-[rgba(244,63,94,0.25)]",  icon: "❌" },
};

export default function MyProfilePage() {
  const [user, setUser]             = useState<User | null>(null);
  const [items, setItems]           = useState<CollectionItem[]>([]);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading]       = useState(true);
  const [saving, setSaving]         = useState(false);
  const [name, setName]             = useState("");
  const [profilePublic, setProfilePublic] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  function loadAll() {
    setLoading(true);
    Promise.all([
      fetch("/api/me").then((r) => r.json()),
      fetch("/api/collection").then((r) => r.json()),
      fetch("/api/me/suggestions").then((r) => r.json()),
    ])
      .then(([userData, collectionData, sugData]) => {
        setUser(userData);
        setName(userData.name ?? "");
        setProfilePublic(userData.profilePublic ?? true);
        setItems(Array.isArray(collectionData) ? collectionData : []);
        setSuggestions(Array.isArray(sugData) ? sugData : []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }

  useEffect(() => { loadAll(); }, []);

  async function saveProfile() {
    setSaving(true);
    try {
      const res = await fetch("/api/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, profilePublic }),
      });
      if (res.ok) setUser(await res.json());
    } finally { setSaving(false); }
  }

  async function deleteSuggestion(id: string) {
    if (!confirm("Delete this suggestion?")) return;
    setDeletingId(id);
    const res = await fetch(`/api/media/${id}`, { method: "DELETE" });
    if (res.ok) setSuggestions((prev) => prev.filter((s) => s.id !== id));
    else { const d = await res.json(); alert(d.error ?? "Delete failed"); }
    setDeletingId(null);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="w-9 h-9 rounded-full border-2 border-[var(--accent)] border-t-transparent animate-spin" />
      </div>
    );
  }

  const pendingCount = suggestions.filter((s) => s.status === "PENDING").length;

  return (
    <div className="max-w-3xl space-y-10">
      {/* Header */}
      <div>
        <h1 className="page-title text-2xl sm:text-3xl text-[var(--foreground)] mb-1">My profile</h1>
        <p className="text-[var(--muted)] text-sm">Your collection is {user?.profilePublic ? "public" : "private"}.</p>
      </div>

      {/* Settings card */}
      <div className="card rounded-[var(--radius-lg)] p-6 max-w-lg">
        <h2 className="font-semibold text-[var(--foreground)] mb-4">Profile settings</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1.5">Display name</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)}
              className="form-input w-full rounded-[var(--radius-lg)] border border-[var(--card-border)] px-4 py-3 text-sm"
              placeholder="Your name" />
          </div>
          <label className="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" checked={profilePublic} onChange={(e) => setProfilePublic(e.target.checked)}
              className="w-4 h-4 rounded border-[var(--card-border)]" />
            <span className="text-sm font-medium">Share my collection publicly</span>
          </label>
          <button type="button" onClick={saveProfile} disabled={saving}
            className="btn btn-primary px-4 py-2 rounded-[var(--radius-lg)] text-sm font-semibold">
            {saving ? "Saving…" : "Save"}
          </button>
        </div>
        {user?.profilePublic && (
          <p className="mt-4 text-sm text-[var(--muted)]">
            Public profile: <Link href={`/profile/${user.id}`} className="text-[var(--accent)] hover:underline">View as others see it</Link>
          </p>
        )}
      </div>

      {/* My suggestions */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-lg font-bold text-[var(--foreground)] flex items-center gap-2">
            <span className="w-1 h-5 rounded-full bg-gradient-to-b from-[var(--accent)] to-[var(--accent-hover)]" />
            My suggestions
            {pendingCount > 0 && (
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-[rgba(251,191,36,0.15)] text-[#fbbf24] border border-[rgba(251,191,36,0.3)]">
                {pendingCount} pending
              </span>
            )}
          </h2>
          <Link href="/media/new" className="text-sm text-[var(--accent)] font-semibold hover:underline">
            + New suggestion
          </Link>
        </div>

        {suggestions.length === 0 ? (
          <div className="card rounded-[var(--radius-lg)] p-8 text-center">
            <p className="text-[var(--muted)] text-sm mb-3">You haven&apos;t suggested any media yet.</p>
            <Link href="/media/new" className="text-[var(--accent)] font-semibold hover:underline text-sm">Suggest something</Link>
          </div>
        ) : (
          <div className="space-y-3">
            {suggestions.map((s) => {
              const st = SUGGESTION_STATUS[s.status] ?? SUGGESTION_STATUS.PENDING;
              const canDelete = s.status !== "APPROVED";
              return (
                <div key={s.id} className="card rounded-[var(--radius-lg)] p-4 flex items-start gap-4">
                  {s.coverUrl ? (
                    <img src={s.coverUrl} alt={s.title} className="w-12 h-16 object-cover rounded-[var(--radius)] border border-[var(--card-border)] shrink-0 bg-[var(--surface)]" />
                  ) : (
                    <div className="w-12 h-16 rounded-[var(--radius)] bg-[var(--surface)] border border-[var(--card-border)] flex items-center justify-center text-xl shrink-0">
                      {TYPE_EMOJI[s.type] ?? "📀"}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${TYPE_BADGE[s.type] ?? ""}`}>{s.type}</span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${st.cls}`}>
                        {st.icon} {st.label}
                      </span>
                    </div>
                    <p className="font-semibold text-sm text-[var(--foreground)] truncate">{s.title}</p>
                    <p className="text-xs text-[var(--muted)] truncate">{s.creator}</p>
                    {s.status === "APPROVED" && (
                      <Link href={`/media/${s.id}`} className="text-xs text-[var(--accent)] hover:underline mt-1 inline-block">
                        View in catalog →
                      </Link>
                    )}
                    {s.status === "REJECTED" && s.rejectionNote && (
                      <p className="text-xs text-[var(--danger)] mt-1 italic">Note: {s.rejectionNote}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xs text-[var(--muted)]">
                      {new Date(s.createdAt).toLocaleDateString()}
                    </span>
                    {canDelete && (
                      <button type="button" onClick={() => deleteSuggestion(s.id)} disabled={deletingId === s.id}
                        className="text-xs text-[var(--muted)] hover:text-[var(--danger)] transition-colors px-1">
                        {deletingId === s.id ? "…" : "Delete"}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Collection preview */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-lg font-bold text-[var(--foreground)] flex items-center gap-2">
            <span className="w-1 h-5 rounded-full bg-gradient-to-b from-[var(--accent)] to-[var(--accent-hover)]" />
            My collection ({items.length})
          </h2>
          {items.length > 0 && (
            <Link href="/home/collection" className="text-sm text-[var(--accent)] font-semibold hover:underline">View all →</Link>
          )}
        </div>
        {items.length === 0 ? (
          <div className="card rounded-[var(--radius-lg)] p-8 text-center">
            <p className="text-[var(--muted)] text-sm mb-3">Nothing in your collection yet.</p>
            <Link href="/home" className="text-[var(--accent)] font-semibold hover:underline text-sm">Browse catalog</Link>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {items.slice(0, 10).map((item) => (
              <Link key={item.id} href={`/media/${item.media.id}`}
                className="card card-hover p-3 flex items-center gap-3 rounded-[var(--radius-lg)]">
                {item.media.coverUrl ? (
                  <img src={item.media.coverUrl} alt="" className="w-10 h-14 object-cover rounded bg-[var(--surface)] shrink-0" />
                ) : (
                  <div className="w-10 h-14 rounded bg-[var(--surface)] flex items-center justify-center text-lg shrink-0">{TYPE_EMOJI[item.media.type] ?? "📀"}</div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-sm text-[var(--foreground)] truncate">{item.media.title}</p>
                  <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${STATUS_CLASS[item.status] ?? ""}`}>
                    {STATUS_LABELS[item.status] ?? item.status}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
