"use client";

import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { signOut } from "next-auth/react";
import type { Session } from "next-auth";

const LogoIcon = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4" />
  </svg>
);
const DashIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h4a1 1 0 011 1v5a1 1 0 01-1 1H5a1 1 0 01-1-1V5zm10 0a1 1 0 011-1h4a1 1 0 011 1v2a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1v-4zm10-3a1 1 0 011-1h4a1 1 0 011 1v7a1 1 0 01-1 1h-4a1 1 0 01-1-1v-7z" />
  </svg>
);
const MediaIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4" />
  </svg>
);
const UsersIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);
const BackIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
  </svg>
);
const LogoutIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
  </svg>
);

export default function AdminShell({
  session,
  children,
}: { session: Session | null; children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  if (!session?.user?.id) {
    router.replace("/login?callbackUrl=/admin");
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--background)]">
        <div className="w-9 h-9 rounded-full border-2 border-[var(--accent)] border-t-transparent animate-spin" />
      </div>
    );
  }

  if (session.user.role !== "ADMIN") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--background)] px-4">
        <div className="text-center">
          <div className="w-14 h-14 rounded-2xl bg-[var(--danger-soft)] flex items-center justify-center mx-auto mb-4 text-2xl">⛔</div>
          <h1 className="font-display text-xl font-semibold mb-2">Access denied</h1>
          <p className="text-[var(--muted)] text-sm mb-6">This area is for administrators only.</p>
          <Link href="/home" className="text-[var(--accent)] font-medium hover:underline">← Back to app</Link>
        </div>
      </div>
    );
  }

  const nav = [
    { href: "/admin/dashboard", label: "Dashboard", icon: DashIcon },
    { href: "/admin/media",     label: "Media",     icon: MediaIcon },
    { href: "/admin/users",     label: "Users",     icon: UsersIcon },
  ];

  return (
    <div className="min-h-screen flex bg-grid">
      <aside className="w-56 shrink-0 flex flex-col bg-[var(--card)] border-r border-[var(--card-border)]">
        {/* Brand */}
        <div className="p-4 border-b border-[var(--card-border)]">
          <Link href="/admin/dashboard" className="flex items-center gap-2">
            <span className="flex items-center justify-center w-8 h-8 rounded-[var(--radius)] bg-gradient-to-br from-[var(--accent)] to-[var(--accent-hover)] text-white shadow-[0_0_12px_var(--accent-glow)]">
              <LogoIcon />
            </span>
            <div>
              <p className="font-display font-bold text-sm text-[var(--foreground)]">Admin Panel</p>
              <p className="text-xs text-[var(--muted)] truncate max-w-[140px]">{session.user.email}</p>
            </div>
          </Link>
        </div>

        {/* Nav */}
        <nav className="p-2 flex-1 space-y-0.5">
          {nav.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || pathname.startsWith(href + "/");
            return (
              <Link key={href} href={href}
                className={`flex items-center gap-2.5 px-3 py-2.5 rounded-[var(--radius-lg)] text-sm font-medium transition-all ${
                  active
                    ? "bg-[var(--accent-soft)] text-[var(--accent)] shadow-[inset_0_0_0_1px_var(--accent-glow)]"
                    : "text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--surface)]"
                }`}
              >
                <Icon />
                {label}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-2 border-t border-[var(--card-border)] space-y-0.5">
          <Link href="/home"
            className="flex items-center gap-2.5 px-3 py-2.5 rounded-[var(--radius-lg)] text-sm text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--surface)] transition-colors">
            <BackIcon /> Back to app
          </Link>
          <button type="button" onClick={() => signOut({ callbackUrl: "/login" })}
            className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-[var(--radius-lg)] text-sm text-[var(--muted)] hover:text-[var(--danger)] hover:bg-[var(--danger-soft)] transition-colors">
            <LogoutIcon /> Sign out
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-auto p-6 lg:p-8">{children}</main>
    </div>
  );
}
