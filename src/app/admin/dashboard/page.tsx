import Link from "next/link";

export default function AdminDashboardPage() {
  const cards = [
    { href: "/admin/books", label: "Books", desc: "Add, edit, delete books and manage catalog" },
    { href: "/admin/users", label: "Users", desc: "View and manage user accounts" },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-[var(--foreground)] mb-2">Admin dashboard</h1>
      <p className="text-[var(--muted)] mb-8">Manage books and users.</p>
      <div className="grid gap-4 sm:grid-cols-2">
        {cards.map(({ href, label, desc }) => (
          <Link
            key={href}
            href={href}
            className="block rounded-2xl border border-[var(--card-border)] bg-[var(--card)] p-6 shadow-[var(--shadow-card)] hover:border-[var(--accent)]/40 transition-colors"
          >
            <h2 className="font-semibold text-[var(--foreground)] mb-1">{label}</h2>
            <p className="text-sm text-[var(--muted)]">{desc}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
