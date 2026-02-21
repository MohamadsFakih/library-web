"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";

type Media = {
  id: string;
  type: string;
  title: string;
  creator: string;
  releaseDate: string | null;
  genre: string | null;
  description: string | null;
  coverUrl: string | null;
  metadata: string | null;
};

const TYPE_OPTIONS = [
  { value: "MOVIE", label: "🎬 Movie / TV Show" },
  { value: "MUSIC", label: "🎵 Music / Album" },
  { value: "GAME",  label: "🎮 Game" },
];

export default function AdminEditMediaPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const fileRef = useRef<HTMLInputElement>(null);

  const [media, setMedia] = useState<Media | null>(null);
  const [form, setForm] = useState({
    type: "MOVIE" as "MOVIE" | "MUSIC" | "GAME",
    title: "",
    creator: "",
    releaseDate: "",
    genre: "",
    description: "",
    metadata: "",
    coverUrl: "",
  });
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [loadingMedia, setLoadingMedia] = useState(true);

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

  useEffect(() => {
    fetch(`/api/media/${id}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) { setMedia(null); return; }
        setMedia(data);
        setForm({
          type: data.type ?? "MOVIE",
          title: data.title ?? "",
          creator: data.creator ?? "",
          releaseDate: data.releaseDate ? data.releaseDate.slice(0, 10) : "",
          genre: data.genre ?? "",
          description: data.description ?? "",
          metadata: data.metadata ?? "",
          coverUrl: data.coverUrl ?? "",
        });
        if (data.coverUrl) setCoverPreview(data.coverUrl);
      })
      .catch(() => setMedia(null))
      .finally(() => setLoadingMedia(false));
  }, [id]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(""); setLoading(true);
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
      if (!res.ok) { setError(data.error ?? "Failed to update"); setLoading(false); return; }

      if (coverFile) {
        const fd = new FormData();
        fd.append("file", coverFile);
        const upRes = await fetch(`/api/media/${id}/cover`, { method: "POST", body: fd });
        if (!upRes.ok) {
          const upErr = await upRes.json();
          setError(`Saved, but cover upload failed: ${upErr.error ?? "unknown"}`);
          setLoading(false);
          return;
        }
      }

      router.push("/admin/media");
      router.refresh();
    } catch {
      setError("Something went wrong.");
      setLoading(false);
    }
  }

  if (loadingMedia) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="w-9 h-9 rounded-full border-2 border-[var(--accent)] border-t-transparent animate-spin" />
      </div>
    );
  }
  if (!media) {
    return (
      <div className="card rounded-[var(--radius-lg)] p-8 text-center max-w-md">
        <p className="text-[var(--muted)] mb-4">Media not found.</p>
        <Link href="/admin/media" className="text-[var(--accent)] font-semibold hover:underline">Back to catalog</Link>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <Link href="/admin/media" className="text-sm text-[var(--muted)] hover:text-[var(--foreground)]">← Media catalog</Link>
        <h1 className="page-title text-2xl text-[var(--foreground)] mt-2 mb-1">Edit media</h1>
        <p className="text-[var(--muted)] text-sm">{media.title}</p>
      </div>

      <form onSubmit={handleSubmit} className="max-w-2xl space-y-5">
        {error && (
          <div className="rounded-[var(--radius-lg)] bg-[var(--danger-soft)] border border-[var(--danger)]/30 text-[var(--danger)] px-4 py-3 text-sm">{error}</div>
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
                    ? "border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--accent)]"
                    : "border-[var(--card-border)] text-[var(--muted)] hover:border-[var(--accent)]/40 hover:text-[var(--foreground)]"
                }`}
              >{opt.label}</button>
            ))}
          </div>
        </div>

        {/* Fields */}
        <div className="card rounded-[var(--radius-lg)] p-5 space-y-4">
          <h2 className="text-sm font-semibold">Details</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium mb-1.5">Title *</label>
              <input value={form.title} onChange={(e) => set("title", e.target.value)} required
                className="form-input w-full rounded-[var(--radius-lg)] border border-[var(--card-border)] px-4 py-2.5 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Creator *</label>
              <input value={form.creator} onChange={(e) => set("creator", e.target.value)} required
                className="form-input w-full rounded-[var(--radius-lg)] border border-[var(--card-border)] px-4 py-2.5 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Release date</label>
              <input type="date" value={form.releaseDate} onChange={(e) => set("releaseDate", e.target.value)}
                className="form-input w-full rounded-[var(--radius-lg)] border border-[var(--card-border)] px-4 py-2.5 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Genre</label>
              <input value={form.genre} onChange={(e) => set("genre", e.target.value)}
                className="form-input w-full rounded-[var(--radius-lg)] border border-[var(--card-border)] px-4 py-2.5 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Extra info</label>
              <input value={form.metadata} onChange={(e) => set("metadata", e.target.value)}
                className="form-input w-full rounded-[var(--radius-lg)] border border-[var(--card-border)] px-4 py-2.5 text-sm" />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium mb-1.5">Description</label>
              <textarea value={form.description} onChange={(e) => set("description", e.target.value)} rows={3}
                className="form-input w-full rounded-[var(--radius-lg)] border border-[var(--card-border)] px-4 py-2.5 text-sm resize-none" />
            </div>
          </div>
        </div>

        {/* Cover image */}
        <div className="card rounded-[var(--radius-lg)] p-5 space-y-4">
          <h2 className="text-sm font-semibold">Cover image</h2>
          {coverPreview && (
            <div className="flex items-start gap-4">
              <img src={coverPreview} alt="Cover" className="w-20 h-28 object-cover rounded-[var(--radius-lg)] border border-[var(--card-border)] bg-[var(--surface)]" />
              <div className="space-y-1.5">
                <p className="text-sm text-[var(--muted)]">{coverFile ? `New: ${coverFile.name}` : "Current cover"}</p>
                <button type="button" onClick={() => { setCoverFile(null); setCoverPreview(null); set("coverUrl", ""); if (fileRef.current) fileRef.current.value = ""; }}
                  className="text-xs text-[var(--danger)] hover:underline">Remove cover</button>
              </div>
            </div>
          )}
          <div className="space-y-3">
            <div onClick={() => fileRef.current?.click()}
              className="border-2 border-dashed border-[var(--card-border)] rounded-[var(--radius-lg)] p-4 text-center cursor-pointer hover:border-[var(--accent)]/50 hover:bg-[var(--accent-soft)]/20 transition-all">
              <p className="text-sm text-[var(--muted)]">Click to upload new image</p>
            </div>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
            {!coverFile && (
              <>
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-px bg-[var(--card-border)]" />
                  <span className="text-xs text-[var(--muted)]">or URL</span>
                  <div className="flex-1 h-px bg-[var(--card-border)]" />
                </div>
                <input value={form.coverUrl} onChange={(e) => { set("coverUrl", e.target.value); setCoverPreview(e.target.value || null); }}
                  placeholder="https://example.com/cover.jpg"
                  className="form-input w-full rounded-[var(--radius-lg)] border border-[var(--card-border)] px-4 py-2.5 text-sm" />
              </>
            )}
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <button type="submit" disabled={loading} className="btn btn-primary px-5 py-2.5 rounded-[var(--radius-lg)] text-sm font-semibold">
            {loading ? "Saving…" : "Save changes"}
          </button>
          <Link href="/admin/media" className="btn btn-outline px-5 py-2.5 rounded-[var(--radius-lg)] text-sm font-semibold inline-block">Cancel</Link>
        </div>
      </form>
    </div>
  );
}
