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
npx prisma generate
```

4. Create the local SQLite database:

```bash
npx prisma migrate dev
```

If registration fails with `The table main.users does not exist`, the database has not been migrated yet. Run:

```bash
npx prisma migrate dev
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

## Launch Scripts

macOS/Linux:

```bash
./launch.sh
./launch.sh migrate
./launch.sh seed
./launch.sh flask
```

Windows PowerShell:

```powershell
.\launch.ps1
.\launch.ps1 migrate
.\launch.ps1 seed
.\launch.ps1 flask
```

The default command starts the Next.js app. The scripts check for required tools, create `.env` from `.env.example` when needed, install missing dependencies, generate Prisma Client, and stop with clear errors when a step fails.
The Next.js launch command also applies existing Prisma migrations before starting the dev server.

## PostgreSQL

Local development uses SQLite:

```env
DATABASE_URL="file:./dev.db"
```

For PostgreSQL, change the `datasource db` provider in `prisma/schema.prisma` from `sqlite` to `postgresql`, then set `DATABASE_URL` to your PostgreSQL connection string and run a fresh migration.

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
