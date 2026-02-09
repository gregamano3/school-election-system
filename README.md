# School Election System

Fullstack Next.js school election app: login (Student/Admin), CRUD for candidates, positions, parties, voters, votes (view/delete), and **public live results** via SSE.

## Features

- **Login** — Student Voter or Admin Staff (student ID + password). Role comes from the database only.
- **Admin** — Full CRUD: elections, positions, parties, candidates (with photo upload), voters (incl. CSV bulk), votes audit, audit log. End/reactivate election (no delete). Print results to PDF from election page.
- **Voter** — Dashboard, candidates, positions, vote (one per position per election), view results.
- **Results** — Public page at `/results` with live updates (SSE). Election selector; Print/PDF only from admin election page.
- **Voting rules** — One vote per position per election. Once a voter has voted for a position in an election, they cannot vote again for that position in that election; they can vote in other elections and for other positions.

## Tech stack

- **Next.js 16** (App Router), **React 19**, **TypeScript**, **Tailwind CSS**
- **PostgreSQL or MySQL** — set in `.env.local` via `DATABASE_URL`
- **Drizzle ORM** — schema, migrations, queries
- **NextAuth v5** — Credentials provider, JWT sessions
- **bcryptjs** — password hashing
- **Zod** — request validation
- **sharp** — candidate photo processing (JPG/PNG → WebP)

---

## Architecture

- **App Router** — Routes under `app/`: `(voter)` (dashboard, positions, candidates, vote), `(dashboard)` (admin), `login`, `results`, `api/`.
- **Server-first** — Pages are Server Components by default; data fetched in async page/layout. Client Components (`"use client"`) only where needed (forms, toasts, dialogs, live results).
- **API routes** — Under `app/api/`: auth (`/api/auth/[...nextauth]`), public read-only (`/api/elections`, `/api/positions`, `/api/candidates`, `/api/parties`, `/api/results`, `/api/results-sse`), protected write (`/api/votes` for voters, `/api/admin/*` for admins). Installer removed; setup is env + manual DB.
- **Database** — Single DB (PostgreSQL or MySQL). Drizzle for type-safe queries; schema in `lib/db/schema.ts` (Postgres) and `lib/db/schema-mysql.ts` (MySQL). Migrations in `drizzle/*.sql`; `db:migrate` runs them.
- **Auth** — NextAuth with Credentials (studentId + password). No OAuth. Role and identity come only from DB; no client-sent role.

---

## Login, sessions, and token expiry

- **How login works** — User submits ID Number and password on `/login`. NextAuth Credentials provider looks up the user in the DB, verifies password with bcrypt, and creates a session. No separate “token” API; the session is the auth mechanism.
- **Sessions** — Stored as **JWT** (strategy: `jwt`). The JWT is signed with `AUTH_SECRET` and contains `id`, `role`, `studentId`. It is sent to the client (cookie) and validated on each request.
- **Expiry** — Session **maxAge** is configurable via **`SESSION_MAX_AGE_SECONDS`** in `.env.local`. Default is **7200** (2 hours). After that the user must log in again. No refresh token; a new login issues a new JWT.
- **Security** — Passwords are hashed with bcrypt (rounds 10). `AUTH_SECRET` must be set in production and kept private.

---

## State management

- **No global client store** — No Redux, Zustand, or similar. Server state comes from RSC data fetching; client state is local React state (`useState`) and URL (e.g. `?electionId=` for results).
- **Forms and UI** — Form state in component state; dialogs/toasts use small hooks (`useConfirmDialog`, `useInputDialog`, `useCandidateDialog`, `showToast`) that manage their own state.
- **Theme** — Optional dark/light via `ThemeProvider` and `useTheme` in `lib/theme.tsx` (stored in localStorage, no server round-trip).

---

## Patterns and best practices

- **RBAC** — Role is read from DB on login and stored in the JWT/session. Middleware and API routes check `role === "admin"` for admin routes; no role from client input.
- **Validation** — All mutation inputs validated with Zod schemas in `lib/validations`. APIs return 400 with `issues` on validation failure.
- **Audit** — Admin mutations (create/update/delete for elections, positions, parties, candidates, voters, votes) logged via `logAudit()` to `audit_log` table.
- **Idempotent seed** — `db:seed` skips creating election/users if they already exist so it can be run multiple times.
- **Election status** — Central helpers in `lib/election-utils.ts`: `getElectionStatus()`, `isElectionOpenForVoting()`, `isElectionResultsFinal()`. Voting allowed only when election is active and current time is within start/end; admin can end or reactivate.

---

## Security practices

- **Env** — Secrets in `.env.local` (not committed). `.env.example` is the template; only non-secret defaults.
- **Auth** — Credentials only; passwords hashed with bcrypt. Session JWT signed with `AUTH_SECRET`. Middleware protects routes and APIs by session and role.
- **APIs** — Admin APIs require session + role `admin`. Vote API requires session (any authenticated user can vote if election is open). Public APIs are read-only (elections, positions, candidates, parties, results).
- **Uploads** — Candidate photo upload: admin-only; allowed types JPG/PNG (validated by MIME and magic bytes); max 5MB; converted to WebP server-side and stored under `public/uploads/candidates/` (directory in `.gitignore`).
- **SQL** — No raw user input in SQL; Drizzle parameterized queries only.
- **HTTPS** — Use HTTPS in production and set `NEXTAUTH_URL` to the production URL.

---

## Get the project

```bash
git clone https://github.com/YOUR_USERNAME/school-election-system.git
cd school-election-system
```

Replace the URL with your fork or the actual repo URL.

## Setup (no installer)

1. **Copy the env template**

   ```bash
   cp .env.example .env.local
   ```

2. **Edit `.env.local`** — choose **PostgreSQL or MySQL**:

   - **PostgreSQL:**  
     `DATABASE_URL=postgresql://user:password@localhost:5432/school_election`
   - **MySQL (e.g. XAMPP):**  
     `DATABASE_URL=mysql://root:password@localhost:3306/school_election`  
     (XAMPP default often: `mysql://root@localhost:3306/school_election`.)

   Also set:

   - `AUTH_SECRET` — at least 32 characters (e.g. `openssl rand -base64 32`)
   - `NEXTAUTH_URL` — e.g. `http://localhost:3000` (or your production URL)

3. **Database**

   - Create an empty database (e.g. `school_election`).
   - **PostgreSQL:** run `drizzle/0000_init.sql` or `npm run db:migrate`.
   - **MySQL:** run `drizzle/0000_init_mysql.sql` (e.g. in phpMyAdmin or `mysql ... < drizzle/0000_init_mysql.sql`), or `npm run db:migrate`.

4. **Install and run**

   ```bash
   npm install
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000).

5. **Optional:** seed demo data: `npm run db:seed` — admin `admin1` / `admin123`, voter `10001` / `voter123`.

## Production build

```bash
npm run build
npm run start
```

The app runs on Node.js. For XAMPP: use XAMPP for **MySQL only**; run the app with Node (`npm run build` then `npm run start`).

## Run on XAMPP (MySQL)

1. Clone the project and `cd` into it.
2. Start **XAMPP** and start **MySQL**.
3. Create database `school_election` (e.g. in phpMyAdmin), then run the schema:
   - In phpMyAdmin: **Import** → `drizzle/0000_init_mysql.sql` → Go.
   - Or: `C:\xampp\mysql\bin\mysql -u root -p school_election < drizzle/0000_init_mysql.sql`
4. Copy `.env.example` to `.env.local` and set:
   - `DATABASE_URL=mysql://root@localhost:3306/school_election` (or with password)
   - `AUTH_SECRET` and `NEXTAUTH_URL`
5. Run:

   ```bash
   npm install
   npm run build
   npm run start
   ```

   Open [http://localhost:3000](http://localhost:3000). XAMPP is used only for MySQL.

6. Optional: `npm run db:seed` for demo users.

## Run with Docker

Same env approach; no installer.

1. **Start app + PostgreSQL**

   ```bash
   docker-compose up --build
   ```

   App: [http://localhost:3000](http://localhost:3000).  
   PostgreSQL: `localhost:5432` (user `postgres`, password `postgres`, db `school_election`).

2. **Schema (first time)**  
   Run `drizzle/0000_init.sql` or e.g. `docker-compose run --rm app npx drizzle-kit push`.

3. **Optional seed**  
   `docker-compose run --rm app npm run db:seed`

To use **MySQL** in Docker, set `DATABASE_URL` to your MySQL instance and run `drizzle/0000_init_mysql.sql`.

## PostgreSQL vs MySQL

- Set `DATABASE_URL` in `.env.local` to either `postgresql://...` or `mysql://...`.
- Use the matching schema: `drizzle/0000_init.sql` (PostgreSQL) or `drizzle/0000_init_mysql.sql` (MySQL).
- `npm run db:migrate`, `db:seed`, and `db:studio` use the dialect from `DATABASE_URL`.

## Scripts

- `npm run dev` — development server
- `npm run build` / `npm run start` — production
- `npm run db:migrate` — run migrations (PostgreSQL or MySQL from `DATABASE_URL`)
- `npm run db:seed` — seed election, positions, parties, candidates, users
- `npm run db:studio` — Drizzle Studio (when DB is running)
