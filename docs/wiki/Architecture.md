# Architecture

## Runtime

- Next.js App Router
- React and TypeScript
- Prisma ORM
- SQLite in Docker by default
- NextAuth credentials sessions
- Docker startup entrypoint for validation and migrations

## Docker Runtime Flow

1. Container starts as the `nextjs` user.
2. Entrypoint normalizes `DATABASE_URL`, `NEXTAUTH_URL`, and `NEXTAUTH_SECRET`.
3. SQLite path is forced into `/app/data` for Docker persistence when needed.
4. Prisma Client is generated.
5. Configuration is validated.
6. Prisma migrations are applied.
7. Next.js production server starts.

## Data Model

Main entities:

- `User`
- `Trip`
- `Participant`
- `Expense`
- `ExpenseShare`
- `PasswordResetToken`
- `EmailVerificationToken`
- `TwoFactorChallenge`
- `UserAuthAccount`
- `AuthProviderConfig`
- `OAuthLoginToken`
- `AuditLog`

## Core Application Areas

- `app/(auth)` - login, registration, verification, password reset pages
- `app/dashboard` - trip overview
- `app/trips` - trip, participant, and expense workflows
- `app/account` - profile, password, MFA, linked providers
- `app/admin` - users, auth providers, settings, audit logs
- `app/api/auth` - NextAuth, custom login, OAuth start/callback
- `lib/actions` - server actions grouped by domain
- `lib/auth.ts` - NextAuth options and credential flow
- `lib/validation.ts` - Zod schemas and form helpers
- `lib/calculations.ts` - expense/balance calculations
