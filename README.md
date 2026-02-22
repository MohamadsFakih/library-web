# MediaTracker

A personal media collection tracker for movies, music, and games. Browse a shared catalog, add items to your collection, track your status (owned, wishlist, in progress, completed), and share your profile with others.

## Features

- **Media catalog** — Browse movies, music, and games added by admins or suggested by users.
- **Personal collection** — Add any catalog item to your collection and set a status: Owned, Wishlist, In Progress, or Completed.
- **Search & filter** — Filter by title, creator, genre, and media type.
- **Suggest media** — Submit a new movie, game, or album for admin review. Get notified when it's approved or rejected.
- **AI suggestions** — Describe what you're looking for and get AI-powered title suggestions with cover art.
- **Profiles** — Make your collection public and browse what others are tracking.
- **Admin panel** — Manage the catalog, review user suggestions, and manage users at `/admin`.

---

## Running locally (step by step)

### Prerequisites

Make sure you have the following installed before starting:

- [Node.js 18+](https://nodejs.org/) — check with `node -v`
- [Git](https://git-scm.com/) — check with `git --version`
- A terminal (PowerShell, bash, or any shell)

---

### Step 1 — Clone the repo

```bash
git clone https://github.com/MohamadsFakih/media-web.git
cd media-web
```

---

### Step 2 — Install dependencies

```bash
npm install
```

---

### Step 3 — Set up environment variables

Copy the example file:

```bash
# macOS / Linux
cp .env.example .env

# Windows (PowerShell)
Copy-Item .env.example .env
```

Then open `.env` and fill in the values:

```env
# Required — leave as-is for local SQLite
DATABASE_URL="file:./dev.db"

# Required — any random string works locally, e.g. "my-local-secret-123"
AUTH_SECRET=your-random-secret-here

# Required — password for the auto-created admin account
ADMIN_PASSWORD=admin

# Optional — AI media suggestions (get a free token at https://huggingface.co/settings/tokens)
HUGGINGFACE_TOKEN=your_huggingface_token_here

# Optional — better game cover art for all platforms (free key at https://rawg.io/apidocs)
# Without this, only PC game covers are fetched via Steam
RAWG_API_KEY=your_rawg_api_key_here
```

> The app works fully without the optional keys — AI suggestions and game covers will be limited or skipped.

---

### Step 4 — Start the dev server

```bash
npm run dev
```

This single command will:

1. Generate the Prisma database client
2. Create the local SQLite database and apply the schema
3. Seed the database with an admin account and a few sample media items
4. Start the Next.js dev server

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

### Step 5 — Log in

Two accounts are created automatically by the seed:

| Role  | Email             | Password               |
|-------|-------------------|------------------------|
| Admin | admin@admin.com   | value of `ADMIN_PASSWORD` in your `.env` |
| —     | *(register yourself)* | *(use the Register page)* |

- Go to `/admin` to access the admin panel (add media, approve suggestions, manage users).
- Register a normal account at `/register` to use the app as a regular user.

---

## Project structure

```
prisma/
  schema.prisma       — Database models (User, Media, UserMedia, Notification)
  seed.cjs            — Seeds admin account + sample media on startup

src/app/
  (main)/             — User-facing pages (Home, Collection, Media detail, Profile)
  admin/              — Admin pages (Dashboard, Media CRUD, Suggestions, Users)
  api/                — API routes (media, collection, auth, AI, notifications)

src/lib/
  auth.ts             — NextAuth config
  prisma.ts           — Prisma client singleton
```

---

## Deploying to Vercel

1. Push the repo to GitHub.
2. Import the project in [Vercel](https://vercel.com) and set these environment variables:

   | Variable        | Description                                      |
   |-----------------|--------------------------------------------------|
   | `DATABASE_URL`  | PostgreSQL connection string (e.g. Neon, Supabase) |
   | `AUTH_SECRET`   | Random secret — generate with `openssl rand -base64 32` |
   | `ADMIN_PASSWORD`| Password for the seeded admin account            |
   | `HUGGINGFACE_TOKEN` | *(Optional)* AI suggestions                  |
   | `RAWG_API_KEY`  | *(Optional)* Game cover images                   |

3. Deploy. The build automatically switches the database provider to PostgreSQL, runs migrations, and seeds the admin account.

---

## License

MIT
