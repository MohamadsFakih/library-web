"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type User = { id: string; name: string | null; email: string; image: string | null };
type RequestItem = { id: string; from?: User; to?: User; createdAt: string };
type SearchUser = User & { profilePublic?: boolean };

export default function FriendsPage() {
  const [friends, setFriends] = useState<User[]>([]);
  const [requests, setRequests] = useState<{ incoming: RequestItem[]; outgoing: RequestItem[] }>({ incoming: [], outgoing: [] });
  const [loading, setLoading] = useState(true);
  const [acceptingId, setAcceptingId] = useState<string | null>(null);
  const [decliningId, setDecliningId] = useState<string | null>(null);
  const [searchQ, setSearchQ] = useState("");
  const [searchResults, setSearchResults] = useState<SearchUser[]>([]);
  const [searching, setSearching] = useState(false);
  const [sendingRequestTo, setSendingRequestTo] = useState<string | null>(null);

  function load() {
    return Promise.all([
      fetch("/api/friends").then((r) => r.json()),
      fetch("/api/friends/requests").then((r) => r.json()),
    ]).then(([friendsList, reqs]) => {
      setFriends(Array.isArray(friendsList) ? friendsList : []);
      setRequests(reqs?.incoming ? reqs : { incoming: [], outgoing: reqs?.outgoing ?? [] });
    });
  }

  useEffect(() => {
    load().finally(() => setLoading(false));
  }, []);

  async function accept(requestId: string) {
    setAcceptingId(requestId);
    try {
      const res = await fetch("/api/friends/accept", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requestId }),
      });
      if (res.ok) await load();
      else alert((await res.json()).error ?? "Failed");
    } finally {
      setAcceptingId(null);
    }
  }

  async function decline(requestId: string) {
    setDecliningId(requestId);
    try {
      const res = await fetch("/api/friends/decline", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requestId }),
      });
      if (res.ok) await load();
    } finally {
      setDecliningId(null);
    }
  }

  useEffect(() => {
    if (!searchQ || searchQ.length < 2) {
      setSearchResults([]);
      return;
    }
    const t = setTimeout(() => {
      setSearching(true);
      fetch(`/api/users/search?q=${encodeURIComponent(searchQ)}`)
        .then((r) => r.json())
        .then((data) => setSearchResults(Array.isArray(data) ? data : []))
        .catch(() => setSearchResults([]))
        .finally(() => setSearching(false));
    }, 300);
    return () => clearTimeout(t);
  }, [searchQ]);

  async function sendRequest(toUserId: string) {
    setSendingRequestTo(toUserId);
    try {
      const res = await fetch("/api/friends/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ toUserId }),
      });
      const data = await res.json();
      if (res.ok) {
        await load();
        setSearchResults((prev) => prev.filter((u) => u.id !== toUserId));
      } else alert(data.error ?? "Failed");
    } finally {
      setSendingRequestTo(null);
    }
  }

  const friendIds = new Set(friends.map((f) => f.id));
  const outgoingIds = new Set(requests.outgoing?.map((r) => r.to?.id).filter(Boolean) ?? []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="w-9 h-9 rounded-full border-2 border-[var(--accent)] border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div>
      <h1 className="page-title text-2xl sm:text-3xl text-[var(--foreground)] mb-6">Friends</h1>

      {/* Find people */}
      <div className="card rounded-[var(--radius-lg)] p-6 mb-6">
        <h2 className="text-lg font-semibold text-[var(--foreground)] mb-3">Find people</h2>
        <input
          type="search"
          placeholder="Search by name or email…"
          value={searchQ}
          onChange={(e) => setSearchQ(e.target.value)}
          className="form-input w-full max-w-md rounded-[var(--radius-lg)] border border-[var(--card-border)] px-3 py-2 text-sm"
        />
        {searching && <p className="text-sm text-[var(--muted)] mt-2">Searching…</p>}
        {searchResults.length > 0 && (
          <ul className="mt-3 space-y-2">
            {searchResults.map((u) => {
              const isFriend = friendIds.has(u.id);
              const isOutgoing = outgoingIds.has(u.id);
              return (
                <li key={u.id} className="flex items-center justify-between gap-3 p-3 rounded-[var(--radius)] bg-[var(--surface)] border border-[var(--card-border)]">
                  <Link href={`/profile/${u.id}`} className="flex items-center gap-3 min-w-0 flex-1">
                    {u.image ? (
                      <img src={u.image} alt="" className="w-9 h-9 rounded-full object-cover shrink-0" />
                    ) : (
                      <div className="w-9 h-9 rounded-full bg-[var(--card)] flex items-center justify-center text-sm font-medium text-[var(--muted)] shrink-0">
                        {(u.name || u.email).slice(0, 1).toUpperCase()}
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="font-medium text-[var(--foreground)] truncate">{u.name || u.email}</p>
                      <p className="text-xs text-[var(--muted)] truncate">{u.email}</p>
                    </div>
                  </Link>
                  {isFriend ? (
                    <span className="text-xs text-[var(--muted)] shrink-0">Friends</span>
                  ) : isOutgoing ? (
                    <span className="text-xs text-[var(--muted)] shrink-0">Request sent</span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => sendRequest(u.id)}
                      disabled={sendingRequestTo !== null}
                      className="btn btn-primary px-3 py-1.5 rounded-[var(--radius)] text-sm font-medium shrink-0"
                    >
                      {sendingRequestTo === u.id ? "…" : "Add friend"}
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* Incoming requests */}
      {requests.incoming?.length > 0 && (
        <div className="card rounded-[var(--radius-lg)] p-6 mb-6">
          <h2 className="text-lg font-semibold text-[var(--foreground)] mb-4">Friend requests</h2>
          <ul className="space-y-3">
            {requests.incoming.map((r) => (
              <li key={r.id} className="flex items-center justify-between gap-4 p-3 rounded-[var(--radius-lg)] bg-[var(--surface)] border border-[var(--card-border)]">
                <Link href={`/profile/${r.from?.id}`} className="flex items-center gap-3 min-w-0 flex-1">
                  {r.from?.image ? (
                    <img src={r.from.image} alt="" className="w-10 h-10 rounded-full object-cover shrink-0" />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-[var(--card)] flex items-center justify-center text-sm font-medium text-[var(--muted)] shrink-0">
                      {(r.from?.name || r.from?.email || "?").slice(0, 1).toUpperCase()}
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="font-medium text-[var(--foreground)] truncate">{r.from?.name || r.from?.email}</p>
                    <p className="text-xs text-[var(--muted)] truncate">{r.from?.email}</p>
                  </div>
                </Link>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => accept(r.id)}
                    disabled={acceptingId !== null}
                    className="btn btn-primary px-3 py-1.5 rounded-[var(--radius)] text-sm font-medium"
                  >
                    {acceptingId === r.id ? "…" : "Accept"}
                  </button>
                  <button
                    type="button"
                    onClick={() => decline(r.id)}
                    disabled={decliningId !== null}
                    className="btn btn-outline px-3 py-1.5 rounded-[var(--radius)] text-sm text-[var(--muted)] hover:text-[var(--foreground)]"
                  >
                    Decline
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Outgoing */}
      {requests.outgoing?.length > 0 && (
        <div className="card rounded-[var(--radius-lg)] p-6 mb-6">
          <h2 className="text-lg font-semibold text-[var(--foreground)] mb-4">Sent requests</h2>
          <ul className="space-y-3">
            {requests.outgoing.map((r) => (
              <li key={r.id} className="flex items-center gap-3 p-3 rounded-[var(--radius-lg)] bg-[var(--surface)] border border-[var(--card-border)]">
                {r.to?.image ? (
                  <img src={r.to.image} alt="" className="w-10 h-10 rounded-full object-cover shrink-0" />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-[var(--card)] flex items-center justify-center text-sm font-medium text-[var(--muted)] shrink-0">
                    {(r.to?.name || r.to?.email || "?").slice(0, 1).toUpperCase()}
                  </div>
                )}
                <Link href={`/profile/${r.to?.id}`} className="min-w-0 flex-1">
                  <p className="font-medium text-[var(--foreground)] truncate">{r.to?.name || r.to?.email}</p>
                  <p className="text-xs text-[var(--muted)]">Pending</p>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Friends list */}
      <div className="card rounded-[var(--radius-lg)] p-6">
        <h2 className="text-lg font-semibold text-[var(--foreground)] mb-4">Your friends ({friends.length})</h2>
        {friends.length === 0 ? (
          <p className="text-[var(--muted)] text-sm">No friends yet. Visit someone&apos;s profile and click &quot;Add friend&quot; or search from your profile.</p>
        ) : (
          <ul className="space-y-3">
            {friends.map((u) => (
              <li key={u.id}>
                <Link
                  href={`/profile/${u.id}`}
                  className="flex items-center gap-3 p-3 rounded-[var(--radius-lg)] bg-[var(--surface)] border border-[var(--card-border)] hover:shadow-[var(--shadow-hover)] transition-shadow"
                >
                  {u.image ? (
                    <img src={u.image} alt="" className="w-10 h-10 rounded-full object-cover shrink-0" />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-[var(--card)] flex items-center justify-center text-sm font-medium text-[var(--muted)] shrink-0">
                      {(u.name || u.email).slice(0, 1).toUpperCase()}
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="font-medium text-[var(--foreground)] truncate">{u.name || u.email}</p>
                    <p className="text-xs text-[var(--muted)] truncate">{u.email}</p>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
