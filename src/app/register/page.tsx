"use client";

import { useState } from "react";
import Link from "next/link";
import { signInWithCredentials } from "@/lib/credentials-signin";

export default function RegisterPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(""); setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, name: name || undefined }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Registration failed"); setLoading(false); return; }
      const result = await signInWithCredentials(email, password, "/home");
      if (result.ok && result.url) { window.location.href = result.url; return; }
      window.location.href = "/login";
    } catch {
      setError("Something went wrong.");
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-6 py-12 bg-grid">
      <div className="w-full max-w-[380px] animate-slide-up">
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-[var(--radius-lg)] bg-gradient-to-br from-[var(--accent)] to-[var(--accent-hover)] flex items-center justify-center mx-auto mb-4 shadow-[0_0_24px_var(--accent-glow)]">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
            </svg>
          </div>
          <h1 className="font-display text-2xl font-bold mb-1">Create account</h1>
          <p className="text-[var(--muted)] text-sm">Track your media and share your collection.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-[var(--radius-lg)] bg-[var(--danger-soft)] border border-[var(--danger)]/30 text-[var(--danger)] px-4 py-3 text-sm font-medium">{error}</div>
          )}
          <div>
            <label className="block text-sm font-medium mb-1.5">Display name (optional)</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)}
              className="form-input w-full rounded-[var(--radius-lg)] border border-[var(--card-border)] px-4 py-3 text-sm"
              placeholder="Your name" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
              className="form-input w-full rounded-[var(--radius-lg)] border border-[var(--card-border)] px-4 py-3 text-sm"
              placeholder="you@example.com" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">Password (min 6 chars)</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6}
              className="form-input w-full rounded-[var(--radius-lg)] border border-[var(--card-border)] px-4 py-3 text-sm"
              placeholder="••••••••" />
          </div>
          <button type="submit" disabled={loading}
            className="btn btn-primary w-full rounded-[var(--radius-lg)] py-3 text-sm font-semibold">
            {loading ? "Creating…" : "Create account"}
          </button>
        </form>

        <p className="mt-8 text-center text-sm text-[var(--muted)]">
          Already have an account?{" "}
          <Link href="/login" className="text-[var(--accent)] font-semibold hover:underline">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
