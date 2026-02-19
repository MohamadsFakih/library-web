"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { signOut } from "next-auth/react";
import type { Session } from "next-auth";

const LogoIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
      d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4" />
  </svg>
);

const PlusIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
  </svg>
);

export default function HomeShell({
  session,
  children,
}: { session: Session; children: React.ReactNode }) {
  const pathname = usePathname();

  const nav = [
    { href: "/home",            label: "Browse"      },
    { href: "/home/collection", label: "Collection"  },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-grid">
      <header className="sticky top-0 z-40 border-b border-[var(--card-border)] bg-[var(--card)]/80 backdrop-blur-md">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center gap-4">
          {/* Logo */}
          <Link href="/home" className="flex items-center gap-2 text-[var(--foreground)] shrink-0 group">
            <span className="flex items-center justify-center w-8 h-8 rounded-[var(--radius)] bg-gradient-to-br from-[var(--accent)] to-[var(--accent-hover)] text-white shadow-[0_0_12px_var(--accent-glow)] group-hover:shadow-[0_0_20px_var(--accent-glow)] transition-shadow">
              <LogoIcon />
            </span>
            <span className="font-display font-bold text-base tracking-tight hidden sm:block">Media<span className="text-[var(--accent)]">Tracker</span></span>
          </Link>

          {/* Primary nav */}
          <nav className="flex items-center gap-0.5 ml-2">
            {nav.map(({ href, label }) => {
              const active = pathname === href || (href === "/home/collection" && pathname.startsWith("/home/collection"));
              return (
                <Link key={href} href={href}
                  className={`px-3.5 py-1.5 rounded-[var(--radius)] text-sm font-medium transition-all ${
                    active
                      ? "bg-[var(--accent-soft)] text-[var(--accent)] shadow-[inset_0_0_0_1px_var(--accent-glow)]"
                      : "text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--surface)]"
                  }`}
                >
                  {label}
                </Link>
              );
            })}
          </nav>

          {/* Spacer */}
          <div className="flex-1" />

          {/* Add media CTA */}
          <Link href="/media/new"
            className="btn btn-primary flex items-center gap-1.5 px-3.5 py-1.5 rounded-[var(--radius-lg)] text-sm font-semibold">
            <PlusIcon />
            <span className="hidden sm:inline">Add media</span>
          </Link>

          {/* User menu */}
          <div className="flex items-center gap-1">
            <Link href="/profile/me"
              className="px-3 py-1.5 rounded-[var(--radius)] text-sm text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--surface)] transition-colors hidden sm:block">
              Profile
            </Link>
            {session.user.role === "ADMIN" && (
              <Link href="/admin"
                className="px-3 py-1.5 rounded-[var(--radius)] text-xs font-semibold text-[var(--accent)] hover:bg-[var(--accent-soft)] transition-colors">
                Admin
              </Link>
            )}
            <button type="button" onClick={() => signOut({ callbackUrl: "/login" })}
              className="px-3 py-1.5 rounded-[var(--radius)] text-sm text-[var(--muted)] hover:text-[var(--danger)] hover:bg-[var(--danger-soft)] transition-colors">
              Out
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-8">{children}</main>
    </div>
  );
}
