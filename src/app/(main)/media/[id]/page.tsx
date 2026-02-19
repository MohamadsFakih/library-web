"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";

type Media = {
  id: string;
  type: string;
  title: string;
  creator: string;
  genre: string | null;
  description: string | null;
  coverUrl: string | null;
  releaseDate: string | null;
  metadata: string | null;
  createdById: string | null;
  createdBy: { id: string; name: string | null; email: string } | null;
  _count: { userMedia: number };
};

type CollectionEntry = {
  id: string;
  status: string;
  mediaId: string;
};

const STATUS_OPTIONS = [
  { value: "WISHLIST",    label: "Wishlist" },
  { value: "OWNED",       label: "Owned" },
  { value: "IN_PROGRESS", label: "In progress" },
  { value: "COMPLETED",   label: "Completed" },
];

const TYPE_BADGE: Record<string, string> = {
  MOVIE: "badge-movie",
  MUSIC: "badge-music",
  GAME:  "badge-game",
};
const TYPE_LABEL: Record<string, string> = { MOVIE: "Movie", MUSIC: "Music", GAME: "Game" };
const TYPE_EMOJI: Record<string, string> = { MOVIE: "🎬", MUSIC: "🎵", GAME: "🎮" };

export default function MediaDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const id = params.id as string;

  const [media, setMedia] = useState<Media | null>(null);
  const [entry, setEntry] = useState<CollectionEntry | null>(null);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState("WISHLIST");
  const [deleting, setDeleting] = useState(false);

  const isAdmin = session?.user?.role === "ADMIN";
  const isCreator = !!session?.user?.id && media?.createdById === session.user.id;
  const canEdit = isAdmin || isCreator;

  function loadMedia() {
    return fetch(`/api/media/${id}`)
      .then((r) => r.json())
      .then((data) => (data.error ? null : (data as Media)));
  }

  function loadCollection() {
    return fetch("/api/collection")
      .then((r) => r.json())
      .then((data) => {
        const items = Array.isArray(data) ? data : [];
        const my = items.find((i: { media: { id: string } }) => i.media.id === id);
        return my ? ({ id: my.id, status: my.status, mediaId: my.media.id } as CollectionEntry) : null;
      })
      .catch(() => null);
  }

  useEffect(() => {
    setLoading(true);
    Promise.all([loadMedia(), loadCollection()]).then(([m, e]) => {
      setMedia(m);
      setEntry(e);
      setLoading(false);
    });
  }, [id]);

  async function addToCollection() {
    setAdding(true);
    try {
      const res = await fetch("/api/collection", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mediaId: id, status: selectedStatus }),
      });
      const data = await res.json();
      if (res.ok) setEntry({ id: data.id, status: data.status, mediaId: id });
      else alert(data.error ?? "Failed to add");
    } catch { alert("Something went wrong."); }
    setAdding(false);
  }

  async function updateStatus(newStatus: string) {
    if (!entry) return;
    const res = await fetch(`/api/collection/${entry.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    if (res.ok) setEntry((e) => (e ? { ...e, status: newStatus } : null));
  }

  async function removeFromCollection() {
    if (!entry) return;
    const res = await fetch(`/api/collection/${entry.id}`, { method: "DELETE" });
    if (res.ok) setEntry(null);
  }

  async function deleteMedia() {
    if (!confirm("Delete this media item permanently? This will remove it from all collections.")) return;
    setDeleting(true);
    const res = await fetch(`/api/media/${id}`, { method: "DELETE" });
    if (res.ok) { router.push("/home"); return; }
    const d = await res.json();
    alert(d.error ?? "Delete failed");
    setDeleting(false);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-9 h-9 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }
  if (!media) {
    return (
      <div className="card rounded-[var(--radius-xl)] p-10 text-center max-w-md">
        <div className="text-4xl mb-3">🔍</div>
        <p className="text-[var(--muted)] mb-4">Media not found.</p>
        <Link href="/home" className="text-[var(--accent)] font-semibold hover:underline">← Back to catalog</Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl animate-slide-up">
      <div className="flex items-center justify-between mb-6">
        <Link href="/home" className="inline-flex items-center gap-1.5 text-sm text-[var(--muted)] hover:text-[var(--foreground)] transition-colors">
          ← Catalog
        </Link>
        {canEdit && (
          <div className="flex items-center gap-2">
            <Link href={`/media/${id}/edit`}
              className="btn btn-outline px-3.5 py-1.5 rounded-[var(--radius-lg)] text-sm font-medium">
              ✏️ Edit
            </Link>
            <button type="button" onClick={deleteMedia} disabled={deleting}
              className="btn btn-danger px-3.5 py-1.5 rounded-[var(--radius-lg)] text-sm font-medium">
              {deleting ? "Deleting…" : "🗑 Delete"}
            </button>
          </div>
        )}
      </div>

      <div className="card rounded-[var(--radius-xl)] overflow-hidden flex flex-col sm:flex-row">
        {/* Cover */}
        {media.coverUrl ? (
          <div className="sm:w-52 shrink-0 bg-[var(--surface)]">
            <img src={media.coverUrl} alt={media.title} className="w-full h-64 sm:h-full object-cover" />
          </div>
        ) : (
          <div className="sm:w-52 h-48 sm:h-auto bg-gradient-to-br from-[var(--surface)] to-[var(--card)] flex items-center justify-center text-7xl shrink-0 border-r border-[var(--card-border)]">
            {TYPE_EMOJI[media.type] ?? "📀"}
          </div>
        )}

        {/* Info */}
        <div className="p-6 sm:p-8 flex-1 flex flex-col">
          <div className="flex items-start justify-between gap-3 mb-1">
            <span className={`inline-block text-xs font-semibold px-2.5 py-1 rounded-full ${TYPE_BADGE[media.type] ?? ""}`}>
              {TYPE_LABEL[media.type] ?? media.type}
            </span>
            <span className="text-xs text-[var(--muted)]">{media._count.userMedia} in collections</span>
          </div>

          <h1 className="page-title text-2xl font-bold text-[var(--foreground)] mt-1">{media.title}</h1>
          <p className="text-[var(--muted)] font-medium mt-0.5">{media.creator}</p>

          <div className="flex flex-wrap gap-2 mt-3">
            {media.genre && (
              <span className="px-2.5 py-1 rounded-full bg-[var(--surface)] text-xs font-medium text-[var(--muted)] border border-[var(--card-border)]">
                {media.genre}
              </span>
            )}
            {media.releaseDate && (
              <span className="px-2.5 py-1 rounded-full bg-[var(--surface)] text-xs font-medium text-[var(--muted)] border border-[var(--card-border)]">
                {new Date(media.releaseDate).getFullYear()}
              </span>
            )}
            {media.metadata && (
              <span className="px-2.5 py-1 rounded-full bg-[var(--surface)] text-xs font-medium text-[var(--muted)] border border-[var(--card-border)]">
                {media.metadata}
              </span>
            )}
          </div>

          {media.description && (
            <p className="text-sm text-[var(--foreground)]/80 leading-relaxed mt-4 flex-1">{media.description}</p>
          )}

          {media.createdBy && (
            <p className="text-xs text-[var(--muted)] mt-3">
              Added by <span className="font-medium text-[var(--foreground)]">{media.createdBy.name ?? media.createdBy.email}</span>
            </p>
          )}

          {/* Collection actions */}
          <div className="mt-5 pt-4 border-t border-[var(--card-border)]">
            {entry ? (
              <div className="flex flex-wrap items-center gap-3">
                <span className="text-sm font-medium text-[var(--foreground)]">In your collection</span>
                <select value={entry.status} onChange={(e) => updateStatus(e.target.value)}
                  className="form-input rounded-[var(--radius-lg)] border border-[var(--card-border)] px-3 py-2 text-sm">
                  {STATUS_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
                <button type="button" onClick={removeFromCollection}
                  className="text-xs text-[var(--muted)] hover:text-[var(--danger)] transition-colors">Remove</button>
              </div>
            ) : (
              <div className="flex flex-wrap items-center gap-2">
                <select value={selectedStatus} onChange={(e) => setSelectedStatus(e.target.value)}
                  className="form-input rounded-[var(--radius-lg)] border border-[var(--card-border)] px-3 py-2 text-sm">
                  {STATUS_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
                <button type="button" onClick={addToCollection} disabled={adding}
                  className="btn btn-primary px-5 py-2.5 rounded-[var(--radius-lg)] text-sm font-semibold">
                  {adding ? "Adding…" : "+ Add to collection"}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
