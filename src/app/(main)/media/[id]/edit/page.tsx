"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";

const TYPE_OPTIONS = [
  { value: "MOVIE", label: "🎬 Movie / TV Show" },
  { value: "MUSIC", label: "🎵 Music / Album" },
  { value: "GAME",  label: "🎮 Game" },
];

export default function EditMediaPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
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
  const [loadingPage, setLoadingPage] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    fetch(`/api/media/${id}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) { setNotFound(true); return; }
        const rd = data.releaseDate ? data.releaseDate.split("T")[0] : "";
        setForm({
          type: data.type ?? "GAME",
          title: data.title ?? "",
          creator: data.creator ?? "",
          releaseDate: rd,
          genre: data.genre ?? "",
          description: data.description ?? "",
          metadata: data.metadata ?? "",
          coverUrl: data.coverUrl ?? "",
        });
        if (data.coverUrl) setCoverPreview(data.coverUrl);
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoadingPage(false));
  }, [id]);

  function set(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setCoverFile(f);
    setCoverPreview(URL.createObjectURL(f));
    set("coverUrl", "");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(""); setSaving(true); setSuccess(false);

    try {
      const res = await fetch(`/api/media/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          releaseDate: form.releaseDate || null,
          genre: form.genre || null,
          description: form.description || null,
          metadata: form.metadata || null,
          coverUrl: coverFile ? undefined : (form.coverUrl || null),
        }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Failed to save"); setSaving(false); return; }

      if (coverFile) {
        const fd = new FormData();
        fd.append("file", coverFile);
        const upRes = await fetch(`/api/media/${id}/cover`, { method: "POST", body: fd });
        if (!upRes.ok) {
          const upErr = await upRes.json();
          setError(`Saved, but cover upload failed: ${upErr.error ?? "unknown"}`);
          setSaving(false);
          return;
        }
      }

      setSuccess(true);
      setSaving(false);
      setTimeout(() => router.push(`/media/${id}`), 800);
    } catch {
      setError("Something went wrong.");
      setSaving(false);
    }
  }

  if (loadingPage) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-9 h-9 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }
  if (notFound) {
    return (
      <div className="text-center py-20">
        <p className="text-[var(--muted)] mb-4">Media not found or you don't have permission to edit it.</p>
        <Link href="/home" className="text-[var(--accent)] hover:underline">← Back to catalog</Link>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <Link href={`/media/${id}`} className="text-sm text-[var(--muted)] hover:text-[var(--foreground)] transition-colors">
          ← Back to media
        </Link>
        <h1 className="page-title text-2xl font-bold mt-2 mb-1">Edit media</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {error && (
          <div className="rounded-[var(--radius-lg)] bg-[var(--danger-soft)] border border-[var(--danger)]/30 text-[var(--danger)] px-4 py-3 text-sm">{error}</div>
        )}
        {success && (
          <div className="rounded-[var(--radius-lg)] bg-[var(--success-soft)] border border-[var(--success)]/30 text-[var(--success)] px-4 py-3 text-sm font-medium">Saved! Redirecting…</div>
        )}

        {/* Type */}
        <div className="card rounded-[var(--radius-lg)] p-5">
          <label className="block text-sm font-semibold mb-3">Media type</label>
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
          <h2 className="text-sm font-semibold">Details</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">Title *</label>
              <input value={form.title} onChange={(e) => set("title", e.target.value)} required
                className="form-input w-full rounded-[var(--radius-lg)] border border-[var(--card-border)] px-3.5 py-2.5 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Creator *</label>
              <input value={form.creator} onChange={(e) => set("creator", e.target.value)} required
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
                className="form-input w-full rounded-[var(--radius-lg)] border border-[var(--card-border)] px-3.5 py-2.5 text-sm" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">Description</label>
            <textarea value={form.description} onChange={(e) => set("description", e.target.value)}
              rows={3}
              className="form-input w-full rounded-[var(--radius-lg)] border border-[var(--card-border)] px-3.5 py-2.5 text-sm resize-none" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">Extra info (platform, label, studio…)</label>
            <input value={form.metadata} onChange={(e) => set("metadata", e.target.value)}
              className="form-input w-full rounded-[var(--radius-lg)] border border-[var(--card-border)] px-3.5 py-2.5 text-sm" />
          </div>
        </div>

        {/* Cover image */}
        <div className="card rounded-[var(--radius-lg)] p-5 space-y-4">
          <h2 className="text-sm font-semibold">Cover image</h2>
          {coverPreview && (
            <div className="flex items-start gap-4">
              <img src={coverPreview} alt="Cover" className="w-24 h-32 object-cover rounded-[var(--radius-lg)] border border-[var(--card-border)] bg-[var(--surface)]" />
              <div className="space-y-2">
                {coverFile ? (
                  <>
                    <p className="text-sm font-medium">{coverFile.name}</p>
                    <p className="text-xs text-[var(--muted)]">{(coverFile.size / 1024).toFixed(0)} KB · New file selected</p>
                  </>
                ) : (
                  <p className="text-xs text-[var(--muted)]">Current cover</p>
                )}
                <button type="button" onClick={() => { setCoverPreview(null); setCoverFile(null); set("coverUrl", ""); if (fileRef.current) fileRef.current.value = ""; }}
                  className="text-xs text-[var(--danger)] hover:underline">Remove cover</button>
              </div>
            </div>
          )}
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium mb-1.5">Upload new image</label>
              <div onClick={() => fileRef.current?.click()}
                className="border-2 border-dashed border-[var(--card-border)] rounded-[var(--radius-lg)] p-4 text-center cursor-pointer hover:border-[var(--accent)]/50 hover:bg-[var(--accent-soft)]/20 transition-all">
                <p className="text-sm text-[var(--muted)]">Click to browse an <span className="text-[var(--accent)]">image file</span></p>
                <p className="text-xs text-[var(--muted)]/60 mt-0.5">Requires Vercel Blob storage</p>
              </div>
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
            </div>
            {!coverFile && (
              <>
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-px bg-[var(--card-border)]" />
                  <span className="text-xs text-[var(--muted)]">or URL</span>
                  <div className="flex-1 h-px bg-[var(--card-border)]" />
                </div>
                <input value={form.coverUrl} onChange={(e) => { set("coverUrl", e.target.value); setCoverPreview(e.target.value || null); }}
                  placeholder="https://example.com/cover.jpg"
                  className="form-input w-full rounded-[var(--radius-lg)] border border-[var(--card-border)] px-3.5 py-2.5 text-sm" />
              </>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3 pt-2">
          <button type="submit" disabled={saving}
            className="btn btn-primary px-6 py-3 rounded-[var(--radius-lg)] text-sm font-semibold">
            {saving ? "Saving…" : "Save changes"}
          </button>
          <Link href={`/media/${id}`} className="btn btn-outline px-5 py-3 rounded-[var(--radius-lg)] text-sm font-medium">
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
