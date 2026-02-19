# Mini Library Management System

A full-stack library app: browse books, rent and return, admin catalog, and optional AI features. Built with **Next.js 15**, **Prisma**, and **NextAuth v5**.

---

## Features

- **Book management** — Add, edit, delete books (title, author, ISBN, genre, description, cover, copies).
- **Check-in / Check-out** — Users borrow books (check-out) and return them (check-in). Due dates and rental history.
- **Search** — Find books by title, author, or description.
- **Authentication** — Email/password and **SSO** (Google, GitHub). User roles: **USER** and **ADMIN**.
- **Admin panel** — Dashboard, books CRUD, user management (disable/delete). Admin can add books; users rent them.
- **AI** — Book recommendations based on rental history; optional OpenAI summarization for book descriptions.
- **Storage** — Optional Vercel Blob for book cover uploads in production.
- **Database** — SQLite locally; Postgres for production (e.g. Vercel Postgres). Same setup pattern as the recipe app.

---

## Tech stack

| Layer     | Tech                    |
|----------|--------------------------|
| Framework| Next.js 15 (App Router)  |
| Database | Prisma (SQLite / Postgres)|
| Auth     | NextAuth v5 (Credentials + Google + GitHub) |
| Styling  | Tailwind CSS             |

---

## Prerequisites

- **Node.js** 18+ or 20+
- **npm** (or yarn / pnpm)

---

## Run locally

### 1. Install

```bash
cd library-app
npm install
```

### 2. Environment

```bash
cp .env.example .env
```

Edit `.env` and set at least:

| Variable         | Required | Description |
|------------------|----------|-------------|
| `DATABASE_URL`   | Yes      | Local: `file:./dev.db` |
| `AUTH_SECRET`    | Yes      | `openssl rand -base64 32` |
| `ADMIN_PASSWORD` | Yes      | Password for the admin user |

Optional: `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET`, `AUTH_GITHUB_ID` / `AUTH_GITHUB_SECRET` for SSO; `BLOB_READ_WRITE_TOKEN` for cover uploads; `OPENAI_API_KEY` for AI summarization.

### 3. Database

```bash
npx prisma db push
npm run db:seed
```

### 4. Start

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

- **Register** at `/register` or **login** at `/login` (email/password or Google/GitHub if configured).
- **User** — Browse at `/home`, rent at `/books/[id]`, see **My rentals** at `/home/rentals`.
- **Admin** — Go to `/admin` (login with `ADMIN_EMAIL` and `ADMIN_PASSWORD` from `.env`). Add/edit/delete books and manage users.

---

## Scripts

| Command           | Description |
|-------------------|-------------|
| `npm run dev`     | Seed + start dev server (port 3000) |
| `npm run build`   | Build for production (runs ensure-postgres, prisma generate, db push, seed, next build) |
| `npm run start`   | Seed + start production server |
| `npm run db:seed` | Create/update admin and sample books |
| `npm run db:push` | Push Prisma schema to DB |

---

## Admin panel

- **URL:** [http://localhost:3000/admin](http://localhost:3000/admin)
- **Credentials:** Use the email and password from `.env`:
  - `ADMIN_EMAIL` (defaults to `admin@admin.com` if not set)
  - `ADMIN_PASSWORD` (required)

Admin can:

- Add, edit, delete books (and optionally upload cover images if Blob is configured).
- View all users; disable or delete non-admin accounts.

---

## Production / Deploy (e.g. Vercel)

1. Set **environment variables** in your host:

   | Variable         | Required | When   | Description |
   |------------------|----------|--------|-------------|
   | `DATABASE_URL`   | Yes      | Build + Runtime | Postgres URL (e.g. Vercel Postgres) |
   | `AUTH_SECRET`    | Yes      | Runtime | e.g. `openssl rand -base64 32` |
   | `NEXTAUTH_URL`   | Yes      | Runtime | App URL, e.g. `https://your-app.vercel.app` (no trailing slash) |
   | `ADMIN_PASSWORD` | Yes      | Build  | Admin password (seed runs at build and creates/updates admin) |
   | `ADMIN_EMAIL`    | No       | Build  | Defaults to `admin@admin.com` |

   Optional: `AUTH_GOOGLE_*`, `AUTH_GITHUB_*`, `BLOB_READ_WRITE_TOKEN`, `OPENAI_API_KEY`.

2. **Deploy** — The build runs `ensure-postgres-for-build.js` (switches schema to Postgres when `DATABASE_URL` is Postgres), then `prisma generate`, `prisma db push`, `db:seed`, and `next build`. Ensure `DATABASE_URL` and `ADMIN_PASSWORD` are available at **build** time so the admin user exists in production.

3. **Live URL** — After deploy, share the app URL (e.g. `https://your-app.vercel.app`) for testing. Users can register/login (including SSO if configured), browse and rent books; admins use `/admin` to manage books and users.

---

## License

Private / MIT (adjust as needed)
