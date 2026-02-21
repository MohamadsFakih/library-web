"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { AISuggestion } from "@/app/api/ai/media-suggest/route";

const TYPE_OPTIONS = [
  { value: "MOVIE", label: "🎬 Movie / TV Show" },
  { value: "MUSIC", label: "🎵 Music / Album" },
  { value: "GAME",  label: "🎮 Game" },
];

const TYPE_BADGE: Record<string, string> = { MOVIE: "badge-movie", MUSIC: "badge-music", GAME: "badge-game" };
const TYPE_EMOJI: Record<string, string> = { MOVIE: "🎬", MUSIC: "🎵", GAME: "🎮" };

// ─── AI Suggest panel ────────────────────────────────────────────────────────
function AISuggestPanel({
  onFill,
}: {
  onFill: (s: AISuggestion) => void;
}) {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<AISuggestion[]>([]);
  const [error, setError] = useState("");
  const [addingId, setAddingId] = useState<string | null>(null);
  const [addedIds, setAddedIds] = useState<Set<string>>(new Set());

  async function suggest() {
    if (!query.trim()) return;
    setError(""); setLoading(true); setSuggestions([]);

    const res = await fetch("/api/ai/media-suggest", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ description: query }),
    });
    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error ?? "AI service failed.");
      return;
    }
    setSuggestions(data.suggestions ?? []);
    if ((data.suggestions ?? []).length === 0) {
      setError("No suggestions returned — try a different description.");
    }
  }

  async function addExistingToCollection(mediaId: string) {
    setAddingId(mediaId);
    const res = await fetch("/api/collection", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mediaId, status: "OWNED" }),
    });
    setAddingId(null);
    if (res.ok) setAddedIds((s) => new Set(s).add(mediaId));
    else { const d = await res.json(); alert(d.error ?? "Failed to add."); }
  }

  return (
    <div className="card rounded-[var(--radius-lg)] overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-[var(--card-border)] flex items-center gap-3"
        style={{ background: "linear-gradient(135deg, rgba(139,92,246,0.12) 0%, rgba(124,58,237,0.06) 100%)" }}>
        <div className="w-8 h-8 rounded-[var(--radius)] bg-gradient-to-br from-[var(--accent)] to-[var(--accent-hover)] flex items-center justify-center text-sm shadow-[0_0_10px_var(--accent-glow)]">✨</div>
        <div>
          <p className="font-semibold text-sm text-[var(--foreground)]">AI Media Finder</p>
          <p className="text-xs text-[var(--muted)]">Describe what you want — AI suggests real titles</p>
        </div>
      </div>

      <div className="p-5 space-y-4">
        {/* Input */}
        <div className="flex gap-2">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && suggest()}
            placeholder="e.g. dark fantasy RPG with great story, 80s synthwave album, sci-fi thriller…"
            className="form-input flex-1 rounded-[var(--radius-lg)] border border-[var(--card-border)] px-4 py-2.5 text-sm"
          />
          <button type="button" onClick={suggest} disabled={loading || !query.trim()}
            className="btn btn-primary px-4 py-2.5 rounded-[var(--radius-lg)] text-sm font-semibold shrink-0 flex items-center gap-1.5 min-w-[90px] justify-center">
            {loading ? (
              <span className="flex items-center gap-1.5">
                <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                Asking…
              </span>
            ) : (
              <>✨ Find</>
            )}
          </button>
        </div>

        {/* Error */}
        {error && (
          <div className="rounded-[var(--radius-lg)] bg-[var(--danger-soft)] border border-[var(--danger)]/30 text-[var(--danger)] px-4 py-3 text-sm">{error}</div>
        )}

        {/* Loading skeleton */}
        {loading && (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="rounded-[var(--radius-lg)] border border-[var(--card-border)] bg-[var(--surface)] p-4 space-y-2 animate-pulse">
                <div className="h-3 bg-[var(--card-border)] rounded-full w-1/3" />
                <div className="h-4 bg-[var(--card-border)] rounded-full w-4/5" />
                <div className="h-3 bg-[var(--card-border)] rounded-full w-1/2" />
                <div className="h-3 bg-[var(--card-border)] rounded-full w-full" />
              </div>
            ))}
          </div>
        )}

        {/* Suggestions */}
        {!loading && suggestions.length > 0 && (
          <div className="space-y-3">
            <p className="text-xs text-[var(--muted)] font-medium uppercase tracking-wider">
              {suggestions.length} suggestion{suggestions.length !== 1 ? "s" : ""} — pick one or fill the form below manually
            </p>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {suggestions.map((s, i) => {
                const inDB = !!s.existingId;
                const alreadyAdded = s.existingId ? addedIds.has(s.existingId) : false;

                return (
                  <div key={i}
                    className={`rounded-[var(--radius-lg)] border p-4 flex flex-col gap-3 transition-all ${
                      inDB
                        ? "border-[var(--success)]/30 bg-[var(--success-soft)]/40"
                        : "border-[var(--card-border)] bg-[var(--surface)] hover:border-[var(--accent)]/40"
                    }`}>
                    {/* Cover / emoji */}
                    <div className="flex items-start gap-3">
                      {(s.existingCoverUrl ?? s.suggestedImageUrl) ? (
                        <img
                          src={s.existingCoverUrl ?? s.suggestedImageUrl ?? ""}
                          alt={s.title}
                          className="w-12 h-16 object-cover rounded-[var(--radius)] border border-[var(--card-border)] shrink-0 bg-[var(--card)]"
                          onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
                        />
                      ) : (
                        <div className="w-12 h-16 rounded-[var(--radius)] bg-[var(--card)] border border-[var(--card-border)] flex items-center justify-center text-2xl shrink-0">
                          {TYPE_EMOJI[s.type] ?? "📀"}
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 mb-0.5 flex-wrap">
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${TYPE_BADGE[s.type] ?? ""}`}>
                            {s.type}
                          </span>
                          {inDB && (
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-[var(--success)]/15 text-[var(--success)] border border-[var(--success)]/25">
                              In catalog
                            </span>
                          )}
                        </div>
                        <p className="font-semibold text-sm text-[var(--foreground)] leading-tight">{s.title}</p>
                        <p className="text-xs text-[var(--muted)] truncate">{s.creator}</p>
                        {s.genre && <p className="text-xs text-[var(--muted)]/70 truncate">{s.genre}{s.releaseYear ? ` · ${s.releaseYear}` : ""}</p>}
                      </div>
                    </div>
                    {s.description && (
                      <p className="text-xs text-[var(--muted)] leading-relaxed line-clamp-2">{s.description}</p>
                    )}

                    {/* Actions */}
                    <div className="flex gap-2 mt-auto">
                      {inDB ? (
                        <>
                          {alreadyAdded ? (
                            <span className="text-xs font-semibold text-[var(--success)] flex items-center gap-1">✓ Added</span>
                          ) : (
                            <button type="button"
                              onClick={() => addExistingToCollection(s.existingId!)}
                              disabled={addingId === s.existingId}
                              className="btn btn-primary flex-1 py-1.5 rounded-[var(--radius)] text-xs font-semibold">
                              {addingId === s.existingId ? "Adding…" : "+ Add to collection"}
                            </button>
                          )}
                          <Link href={`/media/${s.existingId}`}
                            className="btn btn-outline flex-1 py-1.5 rounded-[var(--radius)] text-xs font-semibold text-center">
                            View
                          </Link>
                        </>
                      ) : (
                        <button type="button"
                          onClick={() => onFill(s)}
                          className="btn btn-outline flex-1 py-1.5 rounded-[var(--radius)] text-xs font-semibold hover:border-[var(--accent)] hover:text-[var(--accent)]">
                          ✏️ Fill form
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function CreateMediaPage() {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    type: "GAME",
    title: "",
    creator: "",
    releaseDate: "",
    genre: "",
    description: "",
    metadata: "",
    coverUrl: "",
  });
  const [submitted, setSubmitted] = useState(false);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function set(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function fillFromSuggestion(s: AISuggestion) {
    const imageUrl = s.suggestedImageUrl ?? "";
    setForm({
      type: s.type,
      title: s.title,
      creator: s.creator,
      releaseDate: s.releaseYear ? `${s.releaseYear}-01-01` : "",
      genre: s.genre ?? "",
      description: s.description ?? "",
      metadata: "",
      coverUrl: imageUrl,
    });
    if (imageUrl) { setCoverPreview(imageUrl); setCoverFile(null); }
    // Scroll to form
    document.getElementById("manual-form")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setCoverFile(f);
    const url = URL.createObjectURL(f);
    setCoverPreview(url);
    set("coverUrl", "");
  }

  function clearCover() {
    setCoverFile(null);
    setCoverPreview(null);
    if (fileRef.current) fileRef.current.value = "";
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(""); setSaving(true);

    try {
      const res = await fetch("/api/media", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          releaseDate: form.releaseDate || null,
          genre: form.genre || undefined,
          description: form.description || undefined,
          metadata: form.metadata || undefined,
          coverUrl: coverFile ? undefined : (form.coverUrl || undefined),
        }),
      });

      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Failed to submit"); setSaving(false); return; }

      // Try to upload cover image (best effort — suggestion is already submitted)
      if (coverFile) {
        const fd = new FormData();
        fd.append("file", coverFile);
        await fetch(`/api/media/${data.id}/cover`, { method: "POST", body: fd }).catch(() => {});
      }

      setSubmitted(true);
      setSaving(false);
    } catch {
      setError("Something went wrong.");
      setSaving(false);
    }
  }

  if (submitted) {
    return (
      <div className="max-w-md mx-auto text-center py-16 animate-slide-up">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[var(--accent)] to-[var(--accent-hover)] flex items-center justify-center mx-auto mb-6 text-3xl shadow-[0_0_30px_var(--accent-glow)]">
          ✅
        </div>
        <h1 className="page-title text-2xl font-bold mb-2">Suggestion submitted!</h1>
        <p className="text-[var(--muted)] text-sm mb-8">
          An admin will review your suggestion. Once approved it will appear in the catalog and you can add it to your collection.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/profile/me" className="btn btn-primary px-6 py-3 rounded-[var(--radius-lg)] text-sm font-semibold text-center">
            View my suggestions
          </Link>
          <Link href="/media/new" onClick={() => setSubmitted(false)} className="btn btn-outline px-6 py-3 rounded-[var(--radius-lg)] text-sm font-semibold text-center">
            Suggest another
          </Link>
          <Link href="/home" className="btn btn-outline px-6 py-3 rounded-[var(--radius-lg)] text-sm font-semibold text-center">
            Browse catalog
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto animate-slide-up">
      <div className="mb-6">
        <Link href="/home" className="text-sm text-[var(--muted)] hover:text-[var(--foreground)] transition-colors">
          ← Back to catalog
        </Link>
        <h1 className="page-title text-2xl font-bold mt-2 mb-1">Suggest media</h1>
        <p className="text-[var(--muted)] text-sm">Suggest a title for the catalog. An admin will review and approve it before it appears.</p>
      </div>

      <div className="space-y-5">
        {/* ── AI Panel ── */}
        <AISuggestPanel onFill={fillFromSuggestion} />

        {/* ── Manual form ── */}
        <div id="manual-form" className="pt-2">
          <div className="flex items-center gap-3 mb-5">
            <div className="flex-1 h-px bg-[var(--card-border)]" />
            <span className="text-xs font-semibold text-[var(--muted)] uppercase tracking-widest">or fill out manually</span>
            <div className="flex-1 h-px bg-[var(--card-border)]" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="rounded-[var(--radius-lg)] bg-[var(--danger-soft)] border border-[var(--danger)]/30 text-[var(--danger)] px-4 py-3 text-sm">{error}</div>
            )}

            {/* Type */}
            <div className="card rounded-[var(--radius-lg)] p-5">
              <label className="block text-sm font-semibold mb-3">Media type *</label>
              <div className="grid grid-cols-3 gap-2">
                {TYPE_OPTIONS.map((opt) => (
                  <button key={opt.value} type="button"
                    onClick={() => set("type", opt.value)}
                    className={`py-3 px-2 rounded-[var(--radius-lg)] border text-sm font-medium transition-all text-center ${
                      form.type === opt.value
                        ? "border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--accent)] shadow-[0_0_0_1px_var(--accent-glow)]"
                        : "border-[var(--card-border)] text-[var(--muted)] hover:border-[var(--accent)]/40 hover:text-[var(--foreground)]"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Core info */}
            <div className="card rounded-[var(--radius-lg)] p-5 space-y-4">
              <h2 className="text-sm font-semibold text-[var(--foreground)]">Details</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1.5">Title *</label>
                  <input value={form.title} onChange={(e) => set("title", e.target.value)} required
                    placeholder={form.type === "GAME" ? "e.g. The Last of Us" : form.type === "MUSIC" ? "e.g. Thriller" : "e.g. Inception"}
                    className="form-input w-full rounded-[var(--radius-lg)] border border-[var(--card-border)] px-3.5 py-2.5 text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">
                    {form.type === "GAME" ? "Developer / Publisher" : form.type === "MUSIC" ? "Artist / Band" : "Director / Creator"} *
                  </label>
                  <input value={form.creator} onChange={(e) => set("creator", e.target.value)} required
                    placeholder={form.type === "GAME" ? "e.g. Naughty Dog" : form.type === "MUSIC" ? "e.g. Michael Jackson" : "e.g. Christopher Nolan"}
                    className="form-input w-full rounded-[var(--radius-lg)] border border-[var(--card-border)] px-3.5 py-2.5 text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">Release date</label>
                  <input value={form.releaseDate} onChange={(e) => set("releaseDate", e.target.value)}
                    type="date"
                    className="form-input w-full rounded-[var(--radius-lg)] border border-[var(--card-border)] px-3.5 py-2.5 text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">Genre</label>
                  <input value={form.genre} onChange={(e) => set("genre", e.target.value)}
                    placeholder={form.type === "GAME" ? "e.g. Action RPG" : form.type === "MUSIC" ? "e.g. Pop / R&B" : "e.g. Sci-Fi Thriller"}
                    className="form-input w-full rounded-[var(--radius-lg)] border border-[var(--card-border)] px-3.5 py-2.5 text-sm" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Description</label>
                <textarea value={form.description} onChange={(e) => set("description", e.target.value)}
                  rows={3} placeholder="Brief summary or notes…"
                  className="form-input w-full rounded-[var(--radius-lg)] border border-[var(--card-border)] px-3.5 py-2.5 text-sm resize-none" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">
                  {form.type === "GAME" ? "Platform (e.g. PS5, PC, Switch)" : form.type === "MUSIC" ? "Label / Format (e.g. Vinyl, Streaming)" : "Studio / Network"}
                </label>
                <input value={form.metadata} onChange={(e) => set("metadata", e.target.value)}
                  placeholder="Optional extra info…"
                  className="form-input w-full rounded-[var(--radius-lg)] border border-[var(--card-border)] px-3.5 py-2.5 text-sm" />
              </div>
            </div>

            {/* Cover image */}
            <div className="card rounded-[var(--radius-lg)] p-5 space-y-4">
              <h2 className="text-sm font-semibold text-[var(--foreground)]">Cover image</h2>
              {coverPreview ? (
                <div className="flex items-start gap-4">
                  <img src={coverPreview} alt="Preview" className="w-24 h-32 object-cover rounded-[var(--radius-lg)] border border-[var(--card-border)] bg-[var(--surface)]" />
                  <div className="space-y-2">
                    <p className="text-sm text-[var(--foreground)] font-medium">{coverFile?.name}</p>
                    <p className="text-xs text-[var(--muted)]">{coverFile ? `${(coverFile.size / 1024).toFixed(0)} KB` : ""}</p>
                    <button type="button" onClick={clearCover} className="text-xs text-[var(--danger)] hover:underline">Remove</button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div onClick={() => fileRef.current?.click()}
                    className="border-2 border-dashed border-[var(--card-border)] rounded-[var(--radius-lg)] p-6 text-center cursor-pointer hover:border-[var(--accent)]/50 hover:bg-[var(--accent-soft)]/20 transition-all group">
                    <div className="text-2xl mb-1 group-hover:scale-110 transition-transform">🖼️</div>
                    <p className="text-sm text-[var(--muted)]">Click to browse <span className="text-[var(--accent)]">image file</span></p>
                    <p className="text-xs text-[var(--muted)]/60 mt-1">JPG, PNG, WebP</p>
                  </div>
                  <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-px bg-[var(--card-border)]" />
                    <span className="text-xs text-[var(--muted)]">or paste URL</span>
                    <div className="flex-1 h-px bg-[var(--card-border)]" />
                  </div>
                  <input value={form.coverUrl} onChange={(e) => set("coverUrl", e.target.value)}
                    placeholder="https://example.com/cover.jpg"
                    className="form-input w-full rounded-[var(--radius-lg)] border border-[var(--card-border)] px-3.5 py-2.5 text-sm" />
                </div>
              )}
            </div>

            {/* Pending notice */}
            <div className="rounded-[var(--radius-lg)] bg-[var(--accent-soft)] border border-[var(--accent)]/20 px-4 py-3 flex items-start gap-3">
              <span className="text-lg shrink-0">⏳</span>
              <p className="text-sm text-[var(--muted)]">
                Your suggestion will be <span className="text-[var(--foreground)] font-semibold">reviewed by an admin</span> before it appears in the catalog. You can track it under <Link href="/profile/me" className="text-[var(--accent)] hover:underline">My suggestions</Link>.
              </p>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button type="submit" disabled={saving}
                className="btn btn-primary px-6 py-3 rounded-[var(--radius-lg)] text-sm font-semibold">
                {saving ? "Submitting…" : "Submit suggestion"}
              </button>
              <Link href="/home" className="btn btn-outline px-5 py-3 rounded-[var(--radius-lg)] text-sm font-medium">
                Cancel
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
