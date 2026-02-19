import Link from "next/link";

const MediaIcon = () => (
  <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" />
  </svg>
);
const UsersIcon = () => (
  <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
  </svg>
);

export default function AdminDashboardPage() {
  const cards = [
    { href: "/admin/media", label: "Media", desc: "Add, edit, delete media (movies, music, games)", icon: MediaIcon },
    { href: "/admin/users", label: "Users", desc: "View and manage user accounts", icon: UsersIcon },
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="page-title text-2xl sm:text-3xl text-[var(--foreground)] mb-2">Admin dashboard</h1>
        <p className="text-[var(--muted)]">Manage media catalog and users.</p>
      </div>
      <div className="grid gap-5 sm:grid-cols-2">
        {cards.map(({ href, label, desc, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className="card card-hover block p-6 rounded-[var(--radius-xl)] group"
          >
            <div className="w-12 h-12 rounded-[var(--radius-lg)] bg-[var(--accent-soft)] text-[var(--accent)] flex items-center justify-center mb-4 group-hover:bg-[var(--accent)] group-hover:text-white transition-colors">
              <Icon />
            </div>
            <h2 className="font-semibold text-[var(--foreground)] mb-1">{label}</h2>
            <p className="text-sm text-[var(--muted)]">{desc}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
