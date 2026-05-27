# TripTally

TripTally is now a native Next.js application for tracking group trip expenses, participants, balances, and settlement suggestions.

## Stack

- Next.js App Router
- TypeScript and React
- Tailwind CSS
- Prisma ORM
- SQLite for local development
- PostgreSQL-ready Prisma setup
- NextAuth.js credentials authentication

## Features

- Register, login, logout, and protected trip routes
- Create, edit, and delete trips
- Add, edit, and delete participants
- Add, edit, and delete expenses
- Equal expense splitting across selected participants
- Paid, owed, net balance, and settlement calculations
- Mobile-first UI with bottom navigation and tap-friendly controls
- Zod-validated server actions and auth inputs
- Docker healthcheck endpoint at `/api/health`
- Unit and mobile end-to-end test coverage
- Structured JSON logs for startup, auth, trips, participants, expenses, and health checks
- Demo seed data

## Local Setup

1. Install dependencies:

```bash
npm install
```

2. Create an environment file:

```bash
cp .env.example .env
```

3. Generate Prisma Client:

```bash
npm run prisma:generate
```

4. Create the local SQLite database:

```bash
npm run prisma:migrate
```

If registration fails with `The table main.users does not exist`, the database has not been migrated yet. Run:

```bash
npm run prisma:migrate
```

5. Optional: seed demo data:

```bash
npm run seed
```

Demo login:

- Email: `demo@triptally.app`
- Password: `DemoPass123`

6. Start the development server:

```bash
npm run dev
```

Open `http://localhost:3000`.

Useful checks:

```bash
npm run lint
npm run type-check
npm run test:unit
npm run build
```

Mobile end-to-end tests use Playwright:

```bash
npx playwright install
npm run test:e2e
```

## Launch Scripts

macOS/Linux:

```bash
./launch.sh
./launch.sh migrate
./launch.sh seed
```

Windows PowerShell:

```powershell
.\launch.ps1
.\launch.ps1 migrate
.\launch.ps1 seed
```

The default command starts the Next.js app. The scripts check for required tools, create `.env` from `.env.example` when needed, install missing dependencies, generate Prisma Client, and stop with clear errors when a step fails.
The Next.js launch command also applies existing Prisma migrations before starting the dev server.

## Docker

Build the production image:

```bash
docker build -t triptally .
```

For local Docker SQLite storage, set Docker-friendly values in `.env`:

```env
DATABASE_URL="file:/app/data/triptally.db"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="replace-with-a-long-random-secret"
```

Run the app with a persistent SQLite volume:

```bash
docker run --name triptally \
  -p 3000:3000 \
  -v triptally_data:/app/data \
  --env-file .env \
  triptally
```

Open `http://localhost:3000`.

On startup the container creates `/app/data` when needed, generates Prisma Client, runs `npx prisma migrate deploy`, and then starts the Next.js production server with `npm start`.
Docker also checks `GET /api/health` every 30 seconds.

To recreate the container while keeping the SQLite database:

```bash
docker rm -f triptally
docker run --name triptally \
  -p 3000:3000 \
  -v triptally_data:/app/data \
  --env-file .env \
  triptally
```

To remove the persisted local Docker database:

```bash
docker volume rm triptally_data
```

## PostgreSQL

Local development uses SQLite:

```env
DATABASE_URL="file:./dev.db"
```

Prisma 7 stores the active connection URL in `prisma.config.ts`, while `prisma/schema.prisma` keeps the datasource provider. For PostgreSQL, change the `datasource db` provider in `prisma/schema.prisma` from `sqlite` to `postgresql`, set `DATABASE_URL` to your PostgreSQL connection string, and run a fresh migration. The app runtime already includes Prisma's PostgreSQL adapter.

## Production

Set production environment values before deploying:

```env
NODE_ENV="production"
DATABASE_URL="file:/app/data/triptally.db"
NEXTAUTH_URL="https://your-domain.example"
NEXTAUTH_SECRET="generate-a-long-random-secret"
```

Production hardening included in the app:

- NextAuth uses JWT sessions, secure cookies in production, `sameSite=lax`, and HTTP-only session/CSRF cookies.
- Credential login and registration use simple in-memory rate limits. For multi-container deployments, replace `lib/rate-limit.ts` with Redis or another shared store.
- All server actions validate route ids and form payloads with Zod.
- `app/error.tsx` and `app/not-found.tsx` provide production-safe error and missing-page views.
- `/api/health` checks database connectivity and is used by the Docker healthcheck.
- Logs are JSON lines on stdout/stderr for container log collection.

Before a production release, run:

```bash
npm install
npm run prisma:generate
npm run lint
npm run type-check
npm run test:unit
npm run build
docker build -t triptally .
```

## After Pulling Changes

After pulling dependency or Prisma changes, run:

```bash
npm install
npm run prisma:generate
npm run prisma:migrate
npm run test:unit
npm run build
```

For Docker:

```bash
docker build -t triptally .
```

## Project Structure

```text
app/
  (auth)/
    login/
    register/
  dashboard/
  trips/
    [tripId]/
  api/
components/
lib/
  auth.ts
  prisma.ts
  calculations.ts
prisma/
  schema.prisma
  seed.ts
prisma.config.ts
public/
styles/
```

## Calculation Logic

Balance logic lives in `lib/calculations.ts`. Each expense tracks the payer and one `ExpenseShare` per selected participant. The app summarizes:

- Total paid per participant
- Total owed per participant
- Net balance
- Settlement suggestions such as `Alice owes Bob $42.15`

Equal splits are stored in cents-aware rounded shares so totals remain stable.
