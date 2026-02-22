# Media Tracker — Personal Media Collection Tracker

Track movies, music, and games in one place. Add items from the catalog to your collection, set status (owned, wishlist, in progress, completed), and share your collection with others.

## Features

- **Media catalog**: Admins add movies, music, and games (title, creator, release date, genre, description).
- **Personal collection**: Users add catalog items to their collection with status: **Owned**, **Wishlist**, **In progress**, **Completed**.
- **Search & filter**: Browse by title, creator, genre, and type (Movie / Music / Game).
- **Profiles**: Toggle “Share my collection” to let others see what you track. View other users’ public collections.
- **AI**: Create edia recommendations isntantly using AI.
- **Auth**: Email/password, sign-in. Admin and user roles.

## How to run

### Prerequisites

- Node.js 18+
- (Optional) PostgreSQL for production; SQLite is used locally.

### 1. Install dependencies

```bash
npm install
```

### 2. Environment variables

Copy the example env and edit:

```bash
cp .env.example .env
```

Required in `.env`:

- `DATABASE_URL` — SQLite for local: `file:./dev.db`
- `AUTH_SECRET` — e.g. `openssl rand -base64 32`
- `ADMIN_PASSWORD` — Used by the seed to create/update the admin user.

Optional: `ADMIN_EMAIL` (default `admin@admin.com`), `AUTH_GOOGLE_*`, `AUTH_GITHUB_*`, `OPENAI_API_KEY`, `BLOB_READ_WRITE_TOKEN` (Vercel Blob for cover uploads).

### 3. Run the app

```bash
npm run dev
```

This will:

- Generate the Prisma client
- Push the schema (create/update SQLite tables)
- Seed the database (admin user + sample media)
- Start the Next.js dev server at [http://localhost:3000](http://localhost:3000)

Log in with the admin email and `ADMIN_PASSWORD` to access the admin area (Media catalog, Users). Register another account to use the app as a normal user (Browse, My collection, Profile).

### 4. Production build

```bash
npm run build
npm start
```

For production, set `DATABASE_URL` to a PostgreSQL connection string (e.g. Vercel Postgres). The build script switches the Prisma provider to PostgreSQL when it detects a `postgresql://` URL.

## Deploy (e.g. Vercel)

1. Connect the repo to Vercel and set environment variables: `DATABASE_URL` (Postgres), `AUTH_SECRET`, `ADMIN_PASSWORD`.
2. Deploy. The build runs migrations and seed; ensure the seed is idempotent (creates admin if missing, adds sample media only when the table is empty).

## Project structure

- `prisma/schema.prisma` — User, Media, UserMedia (collection entries).
- `src/app/(main)/` — User app: Browse, My collection, Media detail, Profile (me + public).
- `src/app/admin/` — Admin: Dashboard, Media CRUD, Users.
- `src/app/api/` — media, collection, me, users/[id]/collection, ai/recommend, ai/summarize, auth.

## License

MIT
