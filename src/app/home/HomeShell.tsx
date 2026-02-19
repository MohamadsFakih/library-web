"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { signOut } from "next-auth/react";
import type { Session } from "next-auth";

export default function HomeShell({
  session,
  children,
}: { session: Session; children: React.ReactNode }) {
  const pathname = usePathname();
  const nav = [
    { href: "/home", label: "Browse" },
    { href: "/home/rentals", label: "My rentals" },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-[var(--background)]">
      <header className="border-b border-[var(--card-border)] bg-[var(--card)]">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/home" className="font-bold text-lg text-[var(--foreground)]">
            Library
          </Link>
          <nav className="flex items-center gap-4">
            {nav.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className={`text-sm font-medium ${pathname === href ? "text-[var(--accent)]" : "text-[var(--muted)] hover:text-[var(--foreground)]"}`}
              >
                {label}
              </Link>
            ))}
            <span className="text-sm text-[var(--muted)] truncate max-w-[140px]">{session.user.email}</span>
            {session.user.role === "ADMIN" && (
              <Link href="/admin" className="text-xs text-[var(--accent)] font-medium hover:underline">
                Admin
              </Link>
            )}
            <button
              type="button"
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="text-sm text-[var(--muted)] hover:text-red-600"
            >
              Sign out
            </button>
          </nav>
        </div>
      </header>
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 py-6">{children}</main>
    </div>
  );
}
