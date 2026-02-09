# School Election System

Fullstack Next.js school election app: login (Student/Admin), CRUD for candidates, positions, parties, voters, votes (view/delete), and **public live results** via SSE.

**Repository:** [github.com/gregamano3/school-election-system](https://github.com/gregamano3/school-election-system) — public and free for schools to use. If this project helps you, consider **starring the repo**.

## Disclaimer

This application was developed with AI assistance (prompt-engineered and built with [Cursor](https://cursor.com)). Use it **at your own risk**. The codebase follows common best practices (parameterized queries, input validation, role-based access, audit logging, secure auth), but no guarantee is made regarding fitness for a particular purpose. Review the code and run your own tests before deploying in production.

## Features

- **Login** — Student Voter or Admin Staff (student ID + password). Role comes from the database only.
- **Admin** — Full CRUD: elections, positions, parties, candidates (with photo upload), voters (incl. CSV bulk and range-based bulk), groups, votes audit, audit log. End/reactivate election (no delete). Print results to PDF from election page. **Password change required on first login** (for seeded default passwords).
- **Voter** — Simplified flow: login → enter election code → view candidates → vote. No dashboard or navigation; just the election.
- **Groups** — Create voter groups and assign voters. Restrict elections to specific groups (or allow all if none selected).
- **Bulk voter creation** — CSV upload or in-app range-based creation (e.g., year 24, range 2000-5000 → creates 24-2000 through 24-5000 with random passwords).
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

- **App Router** — Routes under `app/`: `(voter)` (election code entry, vote), `(dashboard)` (admin), `login`, `results`, `api/`.
- **Server-first** — Pages are Server Components by default; data fetched in async page/layout. Client Components (`"use client"`) only where needed (forms, toasts, dialogs, live results).
- **API routes** — Under `app/api/`: auth (`/api/auth/[...nextauth]`), public read-only (`/api/elections`, `/api/positions`, `/api/candidates`, `/api/parties`, `/api/results`, `/api/results-sse`), protected write (`/api/votes` for voters, `/api/admin/*` for admins). Installer removed; setup is env + manual DB.
- **Database** — Single DB (PostgreSQL or MySQL). Drizzle for type-safe queries; schema in `lib/db/schema.ts` (Postgres) and `lib/db/schema-mysql.ts` (MySQL). Migrations in `drizzle/*.sql`; `db:migrate` runs them.
- **Auth** — NextAuth with Credentials (studentId + password). No OAuth. Role and identity come only from DB; no client-sent role.

---

## Login, sessions, and token expiry

- **How login works** — User submits ID Number and password on `/login`. NextAuth Credentials provider looks up the user in the DB, verifies password with bcrypt, and creates a session. No separate “token” API; the session is the auth mechanism.
  - **Voters** — After login, redirected to `/election-code` to enter an election code, then proceed to vote.
  - **Admins** — After login, redirected to `/admin`. If using a default password (from seeder), a password change dialog appears on first login.
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
git clone https://github.com/gregamano3/school-election-system.git
cd school-election-system
```

Licensing: free to use, fork, and modify; **not allowed to sell** the software. See [LICENSE.md](LICENSE.md).

## Setup (no installer)

1. **Copy the env template**

   ```bash
   cp .env.example .env.local
   ```

2. **Edit `.env.local`** — choose **PostgreSQL or MySQL**:

   - **PostgreSQL:**  
     `DATABASE_URL=postgresql://user:password@localhost:5432/school_election`
   - **MySQL:**  
     `DATABASE_URL=mysql://user:password@localhost:3306/school_election`  
     (Use any MySQL 8+ server — local, cloud, or a stack that includes MySQL.)

   Also set:

   - `AUTH_SECRET` — at least 32 characters (e.g. `openssl rand -base64 32`)
   - `NEXTAUTH_URL` — e.g. `http://localhost:3000` (or your production URL)

3. **Database**

   - Create an empty database (e.g. `school_election`).
   - **PostgreSQL:** run `drizzle/0000_init.sql` or `npm run db:migrate`.
   - **MySQL:** run the migration SQL files in order, or use `npm run db:migrate` (uses `DATABASE_URL` from `.env.local`).

4. **Install and run**

   ```bash
   npm install
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000).

5. **Optional:** seed demo data: `npm run db:seed` — admin `admin1` / `admin123`, voter `10001` / `voter123`.  
   **Note:** Admin will be prompted to change password on first login (default passwords are insecure).

## Production build

```bash
npm run build
npm run start
```

The app runs on Node.js. You need a **database** (PostgreSQL or MySQL); the app itself runs with Node (`npm run build` then `npm run start`).

## Run with MySQL

You need a MySQL 8+ server (local or cloud). The app runs with Node, not inside XAMPP or Apache.

1. Clone the project and `cd` into it.
2. Create database `school_election` (e.g. with MySQL client or phpMyAdmin).
3. Copy `.env.example` to `.env.local` and set:
   - `DATABASE_URL=mysql://user:password@localhost:3306/school_election`
   - `AUTH_SECRET` and `NEXTAUTH_URL`
4. Run migrations and start the app:

   ```bash
   npm install
   npm run db:migrate
   npm run dev
   ```

   Or for production: `npm run build` then `npm run start`.  
   Open [http://localhost:3000](http://localhost:3000).

5. Optional: `npm run db:seed` for demo users.

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
   **Note:** Admin will be prompted to change password on first login.

To use **MySQL** in Docker, set `DATABASE_URL` to your MySQL instance and run `drizzle/0000_init_mysql.sql`.

## PostgreSQL vs MySQL

- Set `DATABASE_URL` in `.env.local` to either `postgresql://...` or `mysql://...`.
- Migrations are in `drizzle/` (numbered SQL files). `npm run db:migrate` runs the correct set based on `DATABASE_URL`.
- `npm run db:migrate`, `db:seed`, and `db:studio` use the dialect from `DATABASE_URL`.

## Scripts

- `npm run dev` — development server
- `npm run build` / `npm run start` — production
- `npm run db:migrate` — run migrations (PostgreSQL or MySQL from `DATABASE_URL`)
- `npm run db:seed` — seed election, positions, parties, candidates, users
- `npm run db:studio` — Drizzle Studio (when DB is running)
