"use client";

import { useEffect, useState } from "react";

type Suggestion = {
  id: string;
  type: string;
  title: string;
  creator: string;
  genre: string | null;
  description: string | null;
  coverUrl: string | null;
  metadata: string | null;
  releaseDate: string | null;
  status: string;
  createdAt: string;
  createdBy: { id: string; name: string | null; email: string } | null;
};

const TYPE_BADGE: Record<string, string> = {
  MOVIE: "badge-movie",
  MUSIC: "badge-music",
  GAME:  "badge-game",
};
const TYPE_EMOJI: Record<string, string> = { MOVIE: "🎬", MUSIC: "🎵", GAME: "🎮" };

export default function AdminSuggestionsPage() {
  const [items, setItems] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState<string | null>(null);
  const [rejectNote, setRejectNote] = useState<Record<string, string>>({});
  const [showRejectForm, setShowRejectForm] = useState<Record<string, boolean>>({});

  function load() {
    setLoading(true);
    fetch("/api/admin/suggestions")
      .then((r) => r.json())
      .then((d) => setItems(Array.isArray(d) ? d : []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, []);

  async function act(id: string, action: "approve" | "reject") {
    setActionId(id);
    const body: { action: string; rejectionNote?: string } = { action };
    if (action === "reject") body.rejectionNote = rejectNote[id] ?? "";

    const res = await fetch(`/api/admin/suggestions/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    setActionId(null);
    if (res.ok) {
      setItems((prev) => prev.filter((s) => s.id !== id));
      setShowRejectForm((prev) => { const n = { ...prev }; delete n[id]; return n; });
    } else {
      const d = await res.json();
      alert(d.error ?? "Action failed");
    }
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="page-title text-2xl font-bold text-[var(--foreground)] mb-1">
          Media suggestions
        </h1>
        <p className="text-[var(--muted)] text-sm">
          Review user-submitted media. Approve to add to the catalog, or reject with an optional note.
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-9 h-9 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : items.length === 0 ? (
        <div className="card rounded-[var(--radius-xl)] p-14 text-center">
          <div className="text-4xl mb-3">✅</div>
          <p className="font-semibold text-[var(--foreground)] mb-1">All clear</p>
          <p className="text-sm text-[var(--muted)]">No pending suggestions right now.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {items.map((s) => (
            <div key={s.id} className="card rounded-[var(--radius-lg)] overflow-hidden flex flex-col sm:flex-row">
              {/* Cover */}
              <div className="sm:w-24 shrink-0 bg-[var(--surface)] flex items-center justify-center border-r border-[var(--card-border)]">
                {s.coverUrl ? (
                  <img src={s.coverUrl} alt={s.title} className="w-full h-32 sm:h-full object-cover" />
                ) : (
                  <div className="h-24 sm:h-full w-full flex items-center justify-center text-4xl">
                    {TYPE_EMOJI[s.type] ?? "📀"}
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="flex-1 p-5 space-y-3">
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${TYPE_BADGE[s.type] ?? ""}`}>
                        {s.type}
                      </span>
                      <span className="text-xs text-[var(--muted)]">
                        by{" "}
                        <span className="font-medium text-[var(--foreground)]">
                          {s.createdBy?.name ?? s.createdBy?.email ?? "Unknown"}
                        </span>
                        {" · "}
                        {new Date(s.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <h2 className="font-bold text-lg text-[var(--foreground)] leading-tight">{s.title}</h2>
                    <p className="text-sm text-[var(--muted)]">{s.creator}</p>
                    {s.genre && <p className="text-xs text-[var(--muted)] mt-0.5">{s.genre}{s.releaseDate ? ` · ${new Date(s.releaseDate).getFullYear()}` : ""}</p>}
                  </div>
                </div>

                {s.description && (
                  <p className="text-sm text-[var(--foreground)]/70 leading-relaxed">{s.description}</p>
                )}
                {s.metadata && (
                  <p className="text-xs text-[var(--muted)] italic">{s.metadata}</p>
                )}

                {/* Reject note form */}
                {showRejectForm[s.id] && (
                  <div className="flex gap-2">
                    <input
                      value={rejectNote[s.id] ?? ""}
                      onChange={(e) => setRejectNote((prev) => ({ ...prev, [s.id]: e.target.value }))}
                      placeholder="Optional note for the user (e.g. duplicate, wrong info)…"
                      className="form-input flex-1 rounded-[var(--radius)] border border-[var(--danger)]/40 px-3 py-2 text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => act(s.id, "reject")}
                      disabled={actionId === s.id}
                      className="btn btn-danger px-4 py-2 rounded-[var(--radius)] text-sm font-semibold shrink-0"
                    >
                      {actionId === s.id ? "…" : "Confirm reject"}
                    </button>
                  </div>
                )}

                {/* Action buttons */}
                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => act(s.id, "approve")}
                    disabled={!!actionId}
                    className="btn btn-primary px-5 py-2 rounded-[var(--radius-lg)] text-sm font-semibold"
                  >
                    {actionId === s.id ? "…" : "✓ Approve"}
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setShowRejectForm((prev) => ({ ...prev, [s.id]: !prev[s.id] }))
                    }
                    disabled={!!actionId}
                    className="btn btn-danger px-5 py-2 rounded-[var(--radius-lg)] text-sm font-semibold"
                  >
                    {showRejectForm[s.id] ? "Cancel" : "✕ Reject"}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
