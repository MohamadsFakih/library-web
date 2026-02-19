"use client";

import { useEffect, useState } from "react";

type UserRow = {
  id: string;
  email: string;
  name: string | null;
  role: string;
  disabled: boolean;
  createdAt: string;
  _count: { rentals: number };
};

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  function load() {
    setLoading(true);
    fetch("/api/admin/users")
      .then((r) => r.json())
      .then((data) => setUsers(Array.isArray(data) ? data : []))
      .catch(() => setUsers([]))
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, []);

  async function toggleDisabled(u: UserRow) {
    if (u.role === "ADMIN") return;
    setUpdatingId(u.id);
    try {
      const res = await fetch(`/api/admin/users/${u.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ disabled: !u.disabled }),
      });
      if (res.ok) load();
    } finally {
      setUpdatingId(null);
    }
  }

  async function deleteUser(u: UserRow) {
    if (u.role === "ADMIN") return;
    if (!confirm(`Delete user "${u.email}"? This cannot be undone.`)) return;
    setUpdatingId(u.id);
    try {
      const res = await fetch(`/api/admin/users/${u.id}`, { method: "DELETE" });
      if (res.ok) load();
    } finally {
      setUpdatingId(null);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 rounded-full border-2 border-[var(--accent)] border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-[var(--foreground)] mb-1">Users</h1>
      <p className="text-[var(--muted)] mb-6">View and manage user accounts.</p>
      <div className="rounded-2xl border border-[var(--card-border)] bg-[var(--card)] overflow-hidden shadow-[var(--shadow-card)]">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--card-border)] bg-[var(--surface)]">
                <th className="text-left px-4 py-3 font-semibold text-[var(--foreground)]">Email</th>
                <th className="text-left px-4 py-3 font-semibold text-[var(--foreground)]">Name</th>
                <th className="text-left px-4 py-3 font-semibold text-[var(--foreground)]">Role</th>
                <th className="text-left px-4 py-3 font-semibold text-[var(--foreground)]">Rentals</th>
                <th className="text-left px-4 py-3 font-semibold text-[var(--foreground)]">Status</th>
                <th className="text-right px-4 py-3 font-semibold text-[var(--foreground)]">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-b border-[var(--card-border)]">
                  <td className="px-4 py-3 font-medium">{u.email}</td>
                  <td className="px-4 py-3 text-[var(--muted)]">{u.name ?? "—"}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${u.role === "ADMIN" ? "bg-[var(--accent-soft)] text-[var(--accent)]" : "bg-[var(--surface)] text-[var(--muted)]"}`}>
                      {u.role}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-[var(--muted)]">{u._count.rentals}</td>
                  <td className="px-4 py-3">
                    {u.disabled ? <span className="text-red-600 text-xs font-medium">Disabled</span> : <span className="text-green-600 text-xs font-medium">Active</span>}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {u.role !== "ADMIN" && (
                      <>
                        <button
                          type="button"
                          onClick={() => toggleDisabled(u)}
                          disabled={updatingId === u.id}
                          className="px-3 py-1.5 rounded-lg text-xs text-[var(--accent)] border border-[var(--accent)]/40 hover:bg-[var(--accent-soft)] disabled:opacity-50 mr-2"
                        >
                          {updatingId === u.id ? "…" : u.disabled ? "Enable" : "Disable"}
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteUser(u)}
                          disabled={updatingId === u.id}
                          className="px-3 py-1.5 rounded-lg text-xs text-red-600 border border-red-200 hover:bg-red-50 disabled:opacity-50"
                        >
                          Delete
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {users.length === 0 && <p className="px-4 py-8 text-center text-[var(--muted)]">No users.</p>}
      </div>
    </div>
  );
}
