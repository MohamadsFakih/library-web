"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Link from "next/link";

type Notification = {
  id: string;
  type: string;
  readAt: string | null;
  createdAt: string;
  mediaId: string | null;
  mediaTitle: string | null;
  actor: { id: string; name: string | null; email: string };
};

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins  = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days  = Math.floor(diff / 86400000);
  if (mins  < 1) return "just now";
  if (mins  < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
}

function notifMeta(n: Notification): { icon: string; text: React.ReactNode; href: string } {
  const media = n.mediaTitle ? `"${n.mediaTitle}"` : "your suggestion";
  switch (n.type) {
    case "MEDIA_APPROVED":
      return {
        icon: "✅",
        text: <><span className="font-semibold text-[var(--success)]">Approved!</span> {media} is now live in the catalog.</>,
        href: n.mediaId ? `/media/${n.mediaId}` : "/home",
      };
    case "MEDIA_REJECTED":
      return {
        icon: "❌",
        text: <><span className="font-semibold text-[var(--danger)]">Rejected.</span> {media} was not added to the catalog.</>,
        href: "/profile/me",
      };
    case "FRIEND_REQUEST":
      return {
        icon: "👋",
        text: <><span className="font-semibold">{n.actor.name ?? n.actor.email}</span> sent you a friend request.</>,
        href: "/profile/me",
      };
    case "FRIEND_ACCEPTED":
      return {
        icon: "🤝",
        text: <><span className="font-semibold">{n.actor.name ?? n.actor.email}</span> accepted your friend request.</>,
        href: "/profile/me",
      };
    default:
      return { icon: "🔔", text: "You have a new notification.", href: "/profile/me" };
  }
}

export default function NotificationBell() {
  const [open, setOpen]         = useState(false);
  const [count, setCount]       = useState(0);
  const [items, setItems]       = useState<Notification[]>([]);
  const [loading, setLoading]   = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const fetchCount = useCallback(() => {
    fetch("/api/notifications/count")
      .then((r) => r.json())
      .then((d) => setCount(d.count ?? 0))
      .catch(() => {});
  }, []);

  // Poll unread count every 30 s
  useEffect(() => {
    fetchCount();
    const id = setInterval(fetchCount, 30000);
    return () => clearInterval(id);
  }, [fetchCount]);

  // Close on outside click
  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  async function handleOpen() {
    if (open) { setOpen(false); return; }
    setOpen(true);
    setLoading(true);
    try {
      const res = await fetch("/api/notifications");
      const data = await res.json();
      setItems(Array.isArray(data) ? data : []);
    } catch {}
    setLoading(false);
    // Mark all as read
    if (count > 0) {
      fetch("/api/notifications/read-all", { method: "POST" })
        .then(() => setCount(0))
        .catch(() => {});
    }
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={handleOpen}
        className={`relative p-2 rounded-[var(--radius)] transition-colors ${
          open ? "bg-[var(--accent-soft)] text-[var(--accent)]" : "text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--surface)]"
        }`}
        aria-label="Notifications"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        {count > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-0.5 rounded-full bg-[var(--accent)] text-white text-[9px] font-bold flex items-center justify-center shadow-[0_0_6px_var(--accent-glow)] animate-glow">
            {count > 99 ? "99+" : count}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 card rounded-[var(--radius-xl)] shadow-[var(--shadow-hover)] overflow-hidden z-50 animate-slide-up">
          <div className="px-4 py-3 border-b border-[var(--card-border)] flex items-center justify-between">
            <span className="font-semibold text-sm text-[var(--foreground)]">Notifications</span>
            {items.some((n) => !n.readAt) && (
              <button type="button"
                onClick={() => { fetch("/api/notifications/read-all", { method: "POST" }); setCount(0); setItems((p) => p.map((n) => ({ ...n, readAt: new Date().toISOString() }))); }}
                className="text-xs text-[var(--accent)] hover:underline">
                Mark all read
              </button>
            )}
          </div>

          <div className="max-h-96 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-10">
                <div className="w-7 h-7 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin" />
              </div>
            ) : items.length === 0 ? (
              <div className="px-4 py-10 text-center">
                <div className="text-3xl mb-2">🔔</div>
                <p className="text-sm text-[var(--muted)]">No notifications yet.</p>
              </div>
            ) : (
              items.map((n) => {
                const { icon, text, href } = notifMeta(n);
                const unread = !n.readAt;
                return (
                  <Link key={n.id} href={href} onClick={() => setOpen(false)}
                    className={`flex items-start gap-3 px-4 py-3 border-b border-[var(--card-border)] last:border-0 transition-colors hover:bg-[var(--surface)] ${unread ? "bg-[var(--accent-soft)]/30" : ""}`}>
                    <span className="text-lg shrink-0 mt-0.5">{icon}</span>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs text-[var(--foreground)] leading-relaxed">{text}</p>
                      <p className="text-[10px] text-[var(--muted)] mt-1">{timeAgo(n.createdAt)}</p>
                    </div>
                    {unread && (
                      <span className="w-2 h-2 rounded-full bg-[var(--accent)] shrink-0 mt-1.5 shadow-[0_0_4px_var(--accent-glow)]" />
                    )}
                  </Link>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
