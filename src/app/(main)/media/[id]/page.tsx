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

type ReviewUser = { id: string; name: string | null; image: string | null };
type ReviewRow = {
  id: string;
  rating: number;
  body: string | null;
  createdAt: string;
  user: ReviewUser;
};
type CommentRow = {
  id: string;
  body: string;
  createdAt: string;
  user: ReviewUser;
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

  const [reviews, setReviews] = useState<{ reviews: ReviewRow[]; averageRating: number | null; total: number } | null>(null);
  const [comments, setComments] = useState<CommentRow[]>([]);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewBody, setReviewBody] = useState("");
  const [commentBody, setCommentBody] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);
  const [submittingComment, setSubmittingComment] = useState(false);
  const [editingReviewId, setEditingReviewId] = useState<string | null>(null);
  const [editReviewRating, setEditReviewRating] = useState(5);
  const [editReviewBody, setEditReviewBody] = useState("");
  const [savingReviewId, setSavingReviewId] = useState<string | null>(null);
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editCommentBody, setEditCommentBody] = useState("");
  const [savingCommentId, setSavingCommentId] = useState<string | null>(null);

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

  function loadReviews() {
    return fetch(`/api/media/${id}/reviews`)
      .then((r) => r.json())
      .then((data) => (data.reviews ? { reviews: data.reviews, averageRating: data.averageRating ?? null, total: data.total ?? data.reviews.length } : null))
      .catch(() => null);
  }
  function loadComments() {
    return fetch(`/api/media/${id}/comments`).then((r) => r.json()).then((data) => (Array.isArray(data) ? data : [])).catch(() => []);
  }

  useEffect(() => {
    setLoading(true);
    Promise.all([loadMedia(), loadCollection()]).then(([m, e]) => {
      setMedia(m);
      setEntry(e);
      setLoading(false);
    });
  }, [id]);

  useEffect(() => {
    if (!id) return;
    loadReviews().then(setReviews);
    loadComments().then(setComments);
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

  async function submitReview() {
    setSubmittingReview(true);
    try {
      const res = await fetch(`/api/media/${id}/reviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating: reviewRating, body: reviewBody.trim() || undefined }),
      });
      const data = await res.json();
      if (res.ok) {
        loadReviews().then(setReviews);
        setReviewBody("");
      } else alert(data.error ?? "Failed to submit review");
    } catch { alert("Something went wrong."); }
    setSubmittingReview(false);
  }

  async function submitComment() {
    if (!commentBody.trim()) return;
    setSubmittingComment(true);
    try {
      const res = await fetch(`/api/media/${id}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: commentBody.trim() }),
      });
      const data = await res.json();
      if (res.ok) {
        setComments((c) => [...c, data]);
        setCommentBody("");
      } else alert(data.error ?? "Failed to post comment");
    } catch { alert("Something went wrong."); }
    setSubmittingComment(false);
  }

  async function deleteReview(reviewId: string) {
    const res = await fetch(`/api/media/${id}/reviews/${reviewId}`, { method: "DELETE" });
    if (res.ok) { setEditingReviewId(null); loadReviews().then(setReviews); }
  }
  async function deleteComment(commentId: string) {
    const res = await fetch(`/api/media/${id}/comments/${commentId}`, { method: "DELETE" });
    if (res.ok) { setEditingCommentId(null); setComments((c) => c.filter((x) => x.id !== commentId)); }
  }

  function startEditReview(r: ReviewRow) {
    setEditingReviewId(r.id);
    setEditReviewRating(r.rating);
    setEditReviewBody(r.body ?? "");
  }
  function cancelEditReview() {
    setEditingReviewId(null);
    setSavingReviewId(null);
  }
  async function saveEditReview(reviewId: string) {
    setSavingReviewId(reviewId);
    try {
      const res = await fetch(`/api/media/${id}/reviews/${reviewId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating: editReviewRating, body: editReviewBody.trim() || null }),
      });
      if (res.ok) { setEditingReviewId(null); loadReviews().then(setReviews); }
      else alert((await res.json()).error ?? "Failed to update");
    } finally {
      setSavingReviewId(null);
    }
  }

  function startEditComment(c: CommentRow) {
    setEditingCommentId(c.id);
    setEditCommentBody(c.body);
  }
  function cancelEditComment() {
    setEditingCommentId(null);
    setSavingCommentId(null);
  }
  async function saveEditComment(commentId: string) {
    if (!editCommentBody.trim()) return;
    setSavingCommentId(commentId);
    try {
      const res = await fetch(`/api/media/${id}/comments/${commentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: editCommentBody.trim() }),
      });
      const data = await res.json();
      if (res.ok) {
        setComments((prev) => prev.map((x) => (x.id === commentId ? { ...x, body: data.body } : x)));
        setEditingCommentId(null);
      } else alert(data.error ?? "Failed to update");
    } finally {
      setSavingCommentId(null);
    }
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

      {/* Reviews & rating */}
      <div className="card rounded-[var(--radius-xl)] p-6 sm:p-8 mt-6">
        <h2 className="text-lg font-semibold text-[var(--foreground)] mb-1">Reviews</h2>
        {reviews && (
          <>
            {reviews.total > 0 && (
              <p className="text-sm text-[var(--muted)] mb-4">
                {reviews.averageRating != null && (
                  <span className="font-medium text-[var(--foreground)]">{reviews.averageRating} ★</span>
                )}{" "}
                from {reviews.total} review{reviews.total !== 1 ? "s" : ""}
              </p>
            )}
            {session?.user && (
              <div className="mb-6 p-4 rounded-[var(--radius-lg)] bg-[var(--surface)] border border-[var(--card-border)]">
                <p className="text-sm font-medium text-[var(--foreground)] mb-2">Add a review</p>
                <div className="flex flex-wrap items-center gap-3 mb-2">
                  {[1, 2, 3, 4, 5].map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setReviewRating(r)}
                      className={`text-xl ${reviewRating >= r ? "text-amber-500" : "text-[var(--muted)]"}`}
                    >
                      ★
                    </button>
                  ))}
                </div>
                <textarea
                  placeholder="Write a review (optional)"
                  value={reviewBody}
                  onChange={(e) => setReviewBody(e.target.value)}
                  className="form-input w-full rounded-[var(--radius-lg)] border border-[var(--card-border)] px-3 py-2 text-sm mb-2 min-h-[80px]"
                  maxLength={2000}
                />
                <button
                  type="button"
                  onClick={submitReview}
                  disabled={submittingReview}
                  className="btn btn-primary px-4 py-2 rounded-[var(--radius-lg)] text-sm font-medium"
                >
                  {submittingReview ? "Saving…" : "Submit review"}
                </button>
              </div>
            )}
            <ul className="space-y-4">
              {reviews.reviews.map((r) => (
                <li key={r.id} className="border-b border-[var(--card-border)] pb-4 last:border-0 last:pb-0">
                  {editingReviewId === r.id ? (
                    <div className="p-3 rounded-[var(--radius-lg)] bg-[var(--surface)] border border-[var(--card-border)]">
                      <div className="flex flex-wrap items-center gap-3 mb-2">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            type="button"
                            onClick={() => setEditReviewRating(star)}
                            className={`text-xl ${editReviewRating >= star ? "text-amber-500" : "text-[var(--muted)]"}`}
                          >
                            ★
                          </button>
                        ))}
                      </div>
                      <textarea
                        value={editReviewBody}
                        onChange={(e) => setEditReviewBody(e.target.value)}
                        className="form-input w-full rounded-[var(--radius-lg)] border border-[var(--card-border)] px-3 py-2 text-sm mb-2 min-h-[80px]"
                        maxLength={2000}
                      />
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => saveEditReview(r.id)}
                          disabled={savingReviewId !== null}
                          className="btn btn-primary px-3 py-1.5 rounded-[var(--radius)] text-sm font-medium"
                        >
                          {savingReviewId === r.id ? "Saving…" : "Save"}
                        </button>
                        <button type="button" onClick={cancelEditReview} className="btn btn-outline px-3 py-1.5 rounded-[var(--radius)] text-sm">
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          {r.user.image ? (
                            <img src={r.user.image} alt="" className="w-8 h-8 rounded-full object-cover shrink-0" />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-[var(--surface)] flex items-center justify-center text-sm font-medium text-[var(--muted)] shrink-0">
                              {(r.user.name || r.user.id).slice(0, 1).toUpperCase()}
                            </div>
                          )}
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-[var(--foreground)] truncate">{r.user.name || "Anonymous"}</p>
                            <p className="text-amber-500 text-sm">{"★".repeat(r.rating)}{"☆".repeat(5 - r.rating)}</p>
                          </div>
                        </div>
                        {(session?.user?.id === r.user.id || session?.user?.role === "ADMIN") && (
                          <div className="flex items-center gap-2 shrink-0">
                            <button type="button" onClick={() => startEditReview(r)} className="text-xs text-[var(--muted)] hover:text-[var(--foreground)]">Edit</button>
                            <button type="button" onClick={() => deleteReview(r.id)} className="text-xs text-[var(--muted)] hover:text-[var(--danger)]">Delete</button>
                          </div>
                        )}
                      </div>
                      {r.body && <p className="text-sm text-[var(--foreground)]/90 mt-1 whitespace-pre-wrap">{r.body}</p>}
                      <p className="text-xs text-[var(--muted)] mt-1">{new Date(r.createdAt).toLocaleDateString()}</p>
                    </>
                  )}
                </li>
              ))}
            </ul>
            {reviews.reviews.length === 0 && !session?.user && (
              <p className="text-sm text-[var(--muted)]">No reviews yet. Sign in to leave one.</p>
            )}
          </>
        )}
      </div>

      {/* Comments */}
      <div className="card rounded-[var(--radius-xl)] p-6 sm:p-8 mt-6">
        <h2 className="text-lg font-semibold text-[var(--foreground)] mb-4">Comments</h2>
        {session?.user && (
          <div className="flex gap-2 mb-6">
            <input
              type="text"
              placeholder="Add a comment…"
              value={commentBody}
              onChange={(e) => setCommentBody(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && submitComment()}
              className="form-input flex-1 rounded-[var(--radius-lg)] border border-[var(--card-border)] px-3 py-2 text-sm"
            />
            <button
              type="button"
              onClick={submitComment}
              disabled={submittingComment || !commentBody.trim()}
              className="btn btn-primary px-4 py-2 rounded-[var(--radius-lg)] text-sm font-medium shrink-0"
            >
              {submittingComment ? "…" : "Post"}
            </button>
          </div>
        )}
        <ul className="space-y-3">
          {comments.map((c) => (
            <li key={c.id} className="flex items-start gap-2 p-3 rounded-[var(--radius-lg)] bg-[var(--surface)] border border-[var(--card-border)]">
              {c.user.image ? (
                <img src={c.user.image} alt="" className="w-8 h-8 rounded-full object-cover shrink-0" />
              ) : (
                <div className="w-8 h-8 rounded-full bg-[var(--card)] flex items-center justify-center text-sm font-medium text-[var(--muted)] shrink-0">
                  {(c.user.name || c.user.id).slice(0, 1).toUpperCase()}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-[var(--foreground)]">{c.user.name || "Anonymous"}</p>
                {editingCommentId === c.id ? (
                  <div className="mt-2">
                    <input
                      type="text"
                      value={editCommentBody}
                      onChange={(e) => setEditCommentBody(e.target.value)}
                      className="form-input w-full rounded-[var(--radius-lg)] border border-[var(--card-border)] px-3 py-2 text-sm"
                    />
                    <div className="flex gap-2 mt-2">
                      <button
                        type="button"
                        onClick={() => saveEditComment(c.id)}
                        disabled={savingCommentId !== null || !editCommentBody.trim()}
                        className="btn btn-primary px-3 py-1.5 rounded-[var(--radius)] text-sm font-medium"
                      >
                        {savingCommentId === c.id ? "Saving…" : "Save"}
                      </button>
                      <button type="button" onClick={cancelEditComment} className="btn btn-outline px-3 py-1.5 rounded-[var(--radius)] text-sm">
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <p className="text-sm text-[var(--foreground)]/90 whitespace-pre-wrap">{c.body}</p>
                    <p className="text-xs text-[var(--muted)] mt-0.5">{new Date(c.createdAt).toLocaleString()}</p>
                  </>
                )}
              </div>
              {editingCommentId !== c.id && (session?.user?.id === c.user.id || session?.user?.role === "ADMIN") && (
                <div className="flex items-center gap-2 shrink-0">
                  <button type="button" onClick={() => startEditComment(c)} className="text-xs text-[var(--muted)] hover:text-[var(--foreground)]">Edit</button>
                  <button type="button" onClick={() => deleteComment(c.id)} className="text-xs text-[var(--muted)] hover:text-[var(--danger)]">Delete</button>
                </div>
              )}
            </li>
          ))}
        </ul>
        {comments.length === 0 && !session?.user && (
          <p className="text-sm text-[var(--muted)]">No comments yet. Sign in to comment.</p>
        )}
      </div>
    </div>
  );
}
