"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useSession } from "next-auth/react";

type Item = {
  id: string;
  status: string;
  media: { id: string; type: string; title: string; creator: string; coverUrl: string | null; genre: string | null };
};

type Data = {
  user: { id: string; name: string | null; email: string; image: string | null };
  collection: Item[];
};

type FriendStatus = "none" | "self" | "friends" | "pending_sent" | "pending_received";

const STATUS_LABELS: Record<string, string> = {
  OWNED: "Owned",
  WISHLIST: "Wishlist",
  IN_PROGRESS: "In progress",
  COMPLETED: "Completed",
};

export default function PublicProfilePage() {
  const params = useParams();
  const { data: session } = useSession();
  const id = params.id as string;
  const [data, setData] = useState<Data | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [friendStatus, setFriendStatus] = useState<{ status: FriendStatus; requestId?: string } | null>(null);
  const [friendLoading, setFriendLoading] = useState(false);

  useEffect(() => {
    fetch(`/api/users/${id}/collection`)
      .then((r) => {
        if (!r.ok) throw new Error(r.status === 403 ? "Collection is private" : "Not found");
        return r.json();
      })
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (!session?.user?.id || id === session.user.id) {
      setFriendStatus(id === session?.user?.id ? { status: "self" } : null);
      return;
    }
    fetch(`/api/friends/status/${id}`)
      .then((r) => r.json())
      .then((s) => setFriendStatus(s))
      .catch(() => setFriendStatus(null));
  }, [id, session?.user?.id]);

  async function addFriend() {
    setFriendLoading(true);
    try {
      const res = await fetch("/api/friends/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ toUserId: id }),
      });
      const json = await res.json();
      if (res.ok) setFriendStatus({ status: "pending_sent" });
      else alert(json.error ?? "Failed to send request");
    } finally {
      setFriendLoading(false);
    }
  }

  async function acceptRequest() {
    if (!friendStatus?.requestId) return;
    setFriendLoading(true);
    try {
      const res = await fetch("/api/friends/accept", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requestId: friendStatus.requestId }),
      });
      if (res.ok) setFriendStatus({ status: "friends" });
    } finally {
      setFriendLoading(false);
    }
  }

  async function declineRequest() {
    if (!friendStatus?.requestId) return;
    setFriendLoading(true);
    try {
      await fetch("/api/friends/decline", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requestId: friendStatus.requestId }),
      });
      setFriendStatus({ status: "none" });
    } finally {
      setFriendLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="w-9 h-9 rounded-full border-2 border-[var(--accent)] border-t-transparent animate-spin" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="card rounded-[var(--radius-lg)] p-8 text-center max-w-md">
        <p className="text-[var(--muted)] mb-4">{error || "Profile not found."}</p>
        <Link href="/home" className="text-[var(--accent)] font-semibold hover:underline">← Back to catalog</Link>
      </div>
    );
  }

  const typeEmoji: Record<string, string> = { MOVIE: "🎬", MUSIC: "🎵", GAME: "🎮" };

  const showAddFriend = session?.user?.id && session.user.id !== id && friendStatus?.status === "none";
  const showPendingSent = friendStatus?.status === "pending_sent";
  const showPendingReceived = friendStatus?.status === "pending_received";
  const showFriends = friendStatus?.status === "friends";

  return (
    <div>
      <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="page-title text-2xl sm:text-3xl text-[var(--foreground)] mb-1">
            {data.user.name || data.user.email}&apos;s collection
          </h1>
          <p className="text-[var(--muted)] text-sm">{data.collection.length} items</p>
        </div>
        {session?.user?.id && session.user.id !== id && friendStatus && (
          <div className="flex items-center gap-2">
            {showAddFriend && (
              <button
                type="button"
                onClick={addFriend}
                disabled={friendLoading}
                className="btn btn-primary px-4 py-2 rounded-[var(--radius-lg)] text-sm font-semibold"
              >
                {friendLoading ? "…" : "+ Add friend"}
              </button>
            )}
            {showPendingSent && (
              <span className="px-4 py-2 rounded-[var(--radius-lg)] bg-[var(--surface)] text-sm text-[var(--muted)] border border-[var(--card-border)]">
                Request sent
              </span>
            )}
            {showPendingReceived && (
              <>
                <button
                  type="button"
                  onClick={acceptRequest}
                  disabled={friendLoading}
                  className="btn btn-primary px-3 py-1.5 rounded-[var(--radius)] text-sm font-medium"
                >
                  Accept
                </button>
                <button
                  type="button"
                  onClick={declineRequest}
                  disabled={friendLoading}
                  className="btn btn-outline px-3 py-1.5 rounded-[var(--radius)] text-sm"
                >
                  Decline
                </button>
              </>
            )}
            {showFriends && (
              <span className="px-4 py-2 rounded-[var(--radius-lg)] bg-[var(--accent-soft)] text-sm font-medium text-[var(--accent)] border border-[var(--accent-glow)]">
                Friends
              </span>
            )}
          </div>
        )}
      </div>

      {data.collection.length === 0 ? (
        <div className="card rounded-[var(--radius-lg)] p-10 text-center">
          <p className="text-[var(--muted)]">This collection is empty.</p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {data.collection.map((item) => (
            <Link
              key={item.id}
              href={`/media/${item.media.id}`}
              className="card p-4 flex items-center gap-3 rounded-[var(--radius-lg)] hover:shadow-[var(--shadow-hover)] transition-shadow"
            >
              {item.media.coverUrl ? (
                <img src={item.media.coverUrl} alt="" className="w-14 h-20 object-cover rounded bg-[var(--surface)] shrink-0" />
              ) : (
                <div className="w-14 h-20 rounded bg-[var(--surface)] flex items-center justify-center text-2xl shrink-0">{typeEmoji[item.media.type] ?? "📀"}</div>
              )}
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-[var(--foreground)] truncate">{item.media.title}</p>
                <p className="text-sm text-[var(--muted)] truncate">{item.media.creator}</p>
                <span className="inline-block mt-1 px-2 py-0.5 rounded-[var(--radius)] bg-[var(--surface)] text-xs text-[var(--muted)]">
                  {STATUS_LABELS[item.status] ?? item.status}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
