"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

const TYPE_OPTIONS = [
  { value: "MOVIE", label: "🎬 Movie / TV Show" },
  { value: "MUSIC", label: "🎵 Music / Album" },
  { value: "GAME", label: "🎮 Game" },
];

const STATUS_OPTIONS = [
  { value: "OWNED",       label: "Owned" },
  { value: "WISHLIST",    label: "Wishlist" },
  { value: "IN_PROGRESS", label: "In progress" },
  { value: "COMPLETED",   label: "Completed" },
];

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
  const [addToCollection, setAddToCollection] = useState(true);
  const [initialStatus, setInitialStatus] = useState("OWNED");
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function set(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setCoverFile(f);
    const url = URL.createObjectURL(f);
    setCoverPreview(url);
    set("coverUrl", ""); // clear URL input if file chosen
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
      // 1. Create the media item
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
          addToCollection,
          initialStatus: addToCollection ? initialStatus : undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Failed to create"); setSaving(false); return; }

      const mediaId = data.id as string;

      // 2. Upload cover file if selected
      if (coverFile) {
        const fd = new FormData();
        fd.append("file", coverFile);
        const upRes = await fetch(`/api/media/${mediaId}/cover`, { method: "POST", body: fd });
        if (!upRes.ok) {
          const upErr = await upRes.json();
          // Don't block navigation — just warn
          setError(`Media created, but cover upload failed: ${upErr.error ?? "unknown error"}`);
          setSaving(false);
          router.push(`/media/${mediaId}`);
          return;
        }
      }

      router.push(`/media/${mediaId}`);
    } catch {
      setError("Something went wrong.");
      setSaving(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <Link href="/home" className="text-sm text-[var(--muted)] hover:text-[var(--foreground)] transition-colors">
          ← Back to catalog
        </Link>
        <h1 className="page-title text-2xl font-bold mt-2 mb-1">Add media</h1>
        <p className="text-[var(--muted)] text-sm">Create a new entry in the catalog and optionally add it to your collection.</p>
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
              <label className="block text-sm font-medium mb-1.5">Release year</label>
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
                <button type="button" onClick={clearCover}
                  className="text-xs text-[var(--danger)] hover:underline">Remove</button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium mb-1.5">Upload file</label>
                <div
                  onClick={() => fileRef.current?.click()}
                  className="border-2 border-dashed border-[var(--card-border)] rounded-[var(--radius-lg)] p-6 text-center cursor-pointer hover:border-[var(--accent)]/50 hover:bg-[var(--accent-soft)]/20 transition-all group">
                  <div className="text-2xl mb-1 group-hover:scale-110 transition-transform">🖼️</div>
                  <p className="text-sm text-[var(--muted)]">Click to browse <span className="text-[var(--accent)]">image file</span></p>
                  <p className="text-xs text-[var(--muted)]/60 mt-1">JPG, PNG, WebP (requires Blob storage)</p>
                </div>
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
              </div>
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

        {/* Collection */}
        <div className="card rounded-[var(--radius-lg)] p-5 space-y-3">
          <h2 className="text-sm font-semibold text-[var(--foreground)]">Add to your collection</h2>
          <label className="flex items-center gap-3 cursor-pointer group">
            <div className={`w-10 h-6 rounded-full transition-colors relative ${addToCollection ? "bg-[var(--accent)]" : "bg-[var(--surface)]"}`}
              onClick={() => setAddToCollection((v) => !v)}>
              <div className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-transform ${addToCollection ? "translate-x-5" : "translate-x-1"}`} />
            </div>
            <span className="text-sm font-medium">Add to my collection after creating</span>
          </label>
          {addToCollection && (
            <div className="pl-13">
              <label className="block text-xs text-[var(--muted)] mb-1.5 ml-[52px]">Initial status</label>
              <div className="flex flex-wrap gap-2 ml-[52px]">
                {STATUS_OPTIONS.map((opt) => (
                  <button key={opt.value} type="button"
                    onClick={() => setInitialStatus(opt.value)}
                    className={`px-3 py-1.5 rounded-[var(--radius)] border text-xs font-medium transition-all ${
                      initialStatus === opt.value
                        ? "border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--accent)]"
                        : "border-[var(--card-border)] text-[var(--muted)] hover:border-[var(--accent)]/40"
                    }`}
                  >{opt.label}</button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center gap-3 pt-2">
          <button type="submit" disabled={saving}
            className="btn btn-primary px-6 py-3 rounded-[var(--radius-lg)] text-sm font-semibold">
            {saving ? "Creating…" : "Create media"}
          </button>
          <Link href="/home" className="btn btn-outline px-5 py-3 rounded-[var(--radius-lg)] text-sm font-medium">
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
