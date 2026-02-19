"use client";

import { useEffect, useState } from "react";

type UserRow = {
  id: string;
  email: string;
  name: string | null;
  role: string;
  disabled: boolean;
  createdAt: string;
  _count: { collection: number };
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
      <div className="flex items-center justify-center py-16">
        <div className="w-9 h-9 rounded-full border-2 border-[var(--accent)] border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="page-title text-2xl sm:text-3xl text-[var(--foreground)] mb-1">Users</h1>
        <p className="text-[var(--muted)] text-sm">View and manage user accounts.</p>
      </div>
      <div className="card rounded-[var(--radius-xl)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--card-border)] bg-[var(--surface)]">
                <th className="text-left px-5 py-3.5 font-semibold text-[var(--foreground)]">Email</th>
                <th className="text-left px-5 py-3.5 font-semibold text-[var(--foreground)]">Name</th>
                <th className="text-left px-5 py-3.5 font-semibold text-[var(--foreground)]">Role</th>
                <th className="text-left px-5 py-3.5 font-semibold text-[var(--foreground)]">Collection</th>
                <th className="text-left px-5 py-3.5 font-semibold text-[var(--foreground)]">Status</th>
                <th className="text-right px-5 py-3.5 font-semibold text-[var(--foreground)]">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-b border-[var(--card-border)] last:border-0 hover:bg-[var(--surface)]/50 transition-colors">
                  <td className="px-5 py-3.5 font-medium">{u.email}</td>
                  <td className="px-5 py-3.5 text-[var(--muted)]">{u.name ?? "—"}</td>
                  <td className="px-5 py-3.5">
                    <span className={`inline-block px-2.5 py-1 rounded-[var(--radius)] text-xs font-medium ${u.role === "ADMIN" ? "bg-[var(--accent-soft)] text-[var(--accent)]" : "bg-[var(--surface)] text-[var(--muted)]"}`}>
                      {u.role}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-[var(--muted)]">{u._count.collection}</td>
                  <td className="px-5 py-3.5">
                    {u.disabled ? (
                      <span className="text-[var(--danger)] text-xs font-medium">Disabled</span>
                    ) : (
                      <span className="text-[var(--success)] text-xs font-medium">Active</span>
                    )}
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    {u.role !== "ADMIN" && (
                      <span className="inline-flex gap-2">
                        <button
                          type="button"
                          onClick={() => toggleDisabled(u)}
                          disabled={updatingId === u.id}
                          className="px-3 py-1.5 rounded-[var(--radius)] text-xs font-medium text-[var(--accent)] border border-[var(--accent)]/40 hover:bg-[var(--accent-soft)] disabled:opacity-50 transition-colors"
                        >
                          {updatingId === u.id ? "…" : u.disabled ? "Enable" : "Disable"}
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteUser(u)}
                          disabled={updatingId === u.id}
                          className="px-3 py-1.5 rounded-[var(--radius)] text-xs font-medium text-[var(--danger)] border border-red-200 hover:bg-[var(--danger-soft)] disabled:opacity-50 transition-colors"
                        >
                          Delete
                        </button>
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {users.length === 0 && <p className="px-5 py-10 text-center text-[var(--muted)]">No users.</p>}
      </div>
    </div>
  );
}
