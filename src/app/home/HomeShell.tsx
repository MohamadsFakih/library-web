"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { signOut } from "next-auth/react";
import { useEffect, useState, useRef } from "react";
import type { Session } from "next-auth";

type Notif = {
  id: string;
  type: string;
  actorId: string;
  readAt: string | null;
  createdAt: string;
  actor: { id: string; name: string | null; email: string; image: string | null };
};

const BellIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
  </svg>
);

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
  const [notifCount, setNotifCount] = useState(0);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifs, setNotifs] = useState<Notif[]>([]);
  const notifRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/notifications/count")
      .then((r) => r.json())
      .then((d) => setNotifCount(d?.count ?? 0))
      .catch(() => {});
  }, [pathname]);

  useEffect(() => {
    if (!notifOpen) return;
    fetch("/api/notifications")
      .then((r) => r.json())
      .then((data) => setNotifs(Array.isArray(data) ? data : []))
      .catch(() => setNotifs([]));
  }, [notifOpen]);

  useEffect(() => {
    function close(e: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setNotifOpen(false);
    }
    if (notifOpen) document.addEventListener("click", close);
    return () => document.removeEventListener("click", close);
  }, [notifOpen]);

  async function markAllRead() {
    await fetch("/api/notifications/read-all", { method: "POST" });
    setNotifCount(0);
    setNotifs((n) => n.map((x) => ({ ...x, readAt: new Date().toISOString() })));
  }

  async function markRead(id: string) {
    await fetch(`/api/notifications/${id}/read`, { method: "PATCH" });
    setNotifCount((c) => Math.max(0, c - 1));
    setNotifs((n) => n.map((x) => (x.id === id ? { ...x, readAt: new Date().toISOString() } : x)));
  }

  const nav = [
    { href: "/home",            label: "Browse"      },
    { href: "/home/collection", label: "Collection"  },
    { href: "/home/friends",    label: "Friends"     },
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
              const active = pathname === href
                || (href === "/home/collection" && pathname.startsWith("/home/collection"))
                || (href === "/home/friends" && pathname.startsWith("/home/friends"));
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

          {/* Notifications */}
          <div className="relative" ref={notifRef}>
            <button
              type="button"
              onClick={() => setNotifOpen((o) => !o)}
              className="relative p-2 rounded-[var(--radius)] text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--surface)] transition-colors"
              aria-label="Notifications"
            >
              <BellIcon />
              {notifCount > 0 && (
                <span className="absolute top-0.5 right-0.5 min-w-[18px] h-[18px] flex items-center justify-center rounded-full bg-[var(--accent)] text-white text-xs font-bold">
                  {notifCount > 99 ? "99+" : notifCount}
                </span>
              )}
            </button>
            {notifOpen && (
              <div className="absolute right-0 top-full mt-1 w-80 max-h-[70vh] overflow-auto rounded-[var(--radius-lg)] border border-[var(--card-border)] bg-[var(--card)] shadow-lg z-50">
                <div className="p-2 border-b border-[var(--card-border)] flex items-center justify-between sticky top-0 bg-[var(--card)]">
                  <span className="text-sm font-semibold text-[var(--foreground)]">Notifications</span>
                  {notifCount > 0 && (
                    <button type="button" onClick={markAllRead} className="text-xs text-[var(--accent)] hover:underline">
                      Mark all read
                    </button>
                  )}
                </div>
                <ul className="p-2">
                  {notifs.length === 0 ? (
                    <li className="py-4 text-center text-sm text-[var(--muted)]">No notifications</li>
                  ) : (
                    notifs.map((n) => (
                      <li
                        key={n.id}
                        className={`py-3 px-2 rounded-[var(--radius)] ${!n.readAt ? "bg-[var(--accent-soft)]/50" : ""}`}
                      >
                        <Link
                          href="/home/friends"
                          onClick={() => { if (!n.readAt) markRead(n.id); setNotifOpen(false); }}
                          className="block text-sm text-[var(--foreground)]"
                        >
                          {n.type === "FRIEND_REQUEST" && (
                            <><span className="font-medium">{n.actor.name || n.actor.email}</span> sent you a friend request.</>
                          )}
                          {n.type === "FRIEND_ACCEPTED" && (
                            <><span className="font-medium">{n.actor.name || n.actor.email}</span> accepted your friend request.</>
                          )}
                          <span className="block text-xs text-[var(--muted)] mt-0.5">
                            {new Date(n.createdAt).toLocaleString()}
                          </span>
                        </Link>
                      </li>
                    ))
                  )}
                </ul>
              </div>
            )}
          </div>

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
