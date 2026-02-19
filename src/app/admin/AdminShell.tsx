"use client";

import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { signOut } from "next-auth/react";
import type { Session } from "next-auth";

export default function AdminShell({
  session,
  children,
}: { session: Session | null; children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  if (!session?.user?.id) {
    router.replace("/login?callbackUrl=/admin");
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-[var(--accent)] border-t-transparent animate-spin" />
      </div>
    );
  }

  if (session.user.role !== "ADMIN") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--background)]">
        <div className="text-center">
          <h1 className="text-xl font-bold text-[var(--foreground)] mb-2">Access denied</h1>
          <p className="text-[var(--muted)] mb-4">Admin only.</p>
          <Link href="/home" className="text-[var(--accent)] font-medium hover:underline">Back to app</Link>
        </div>
      </div>
    );
  }

  const nav = [
    { href: "/admin/dashboard", label: "Dashboard" },
    { href: "/admin/books", label: "Books" },
    { href: "/admin/users", label: "Users" },
  ];

  return (
    <div className="min-h-screen flex bg-[var(--background)]">
      <aside className="w-56 shrink-0 border-r border-[var(--card-border)] bg-[var(--card)] flex flex-col">
        <div className="p-4 border-b border-[var(--card-border)]">
          <h2 className="font-bold text-[var(--foreground)]">Admin</h2>
          <p className="text-xs text-[var(--muted)] truncate">{session.user.email}</p>
        </div>
        <nav className="p-2 flex-1">
          {nav.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className={`block px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                pathname === href ? "bg-[var(--accent-soft)] text-[var(--accent)]" : "text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--surface)]"
              }`}
            >
              {label}
            </Link>
          ))}
        </nav>
        <div className="p-2 border-t border-[var(--card-border)]">
          <Link href="/home" className="block px-3 py-2 rounded-lg text-sm text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--surface)]">
            ← Back to app
          </Link>
          <button
            type="button"
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="w-full text-left px-3 py-2 rounded-lg text-sm text-[var(--muted)] hover:text-red-600 hover:bg-red-50"
          >
            Sign out
          </button>
        </div>
      </aside>
      <main className="flex-1 overflow-auto p-6">{children}</main>
    </div>
  );
}
