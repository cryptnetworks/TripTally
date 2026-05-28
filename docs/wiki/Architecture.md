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
2. Entrypoint normalizes `DATABASE_URL`, `NEXTAUTH_URL`, `NEXTAUTH_SECRET`, and `TOKEN_DIGEST_SECRET`.
3. SQLite path is forced into `/app/data` for Docker persistence when needed.
4. Prisma Client is generated.
5. Configuration is validated.
6. Prisma migrations are applied.
7. Next.js production server starts.

## Data Model

Main entities:

- `User`
- `Trip`
- `TripMember`
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
- `lib/trip-access.ts` - trip membership lookup and manager enforcement
- `lib/trip-permissions.ts` - pure permission and expense status rules
- `lib/validation.ts` - Zod schemas and form helpers
- `lib/calculations.ts` - expense/balance calculations

## Collaborative Expense Model

Trips have explicit memberships in `TripMember`. The trip owner is also recorded
as an `owner` member for consistent access checks. Participant records may link
to app users through `Participant.userId`; when a manager adds a participant
whose email matches an account, that user is added as a trip member.

Expenses track `createdByUserId`, `paidByUserId`, `updatedByUserId`, and
`status`. Draft expenses are private to the creator and managers and are not
included in balances. Submitted, approved, disputed, and settled expenses are
included in balances. Settled expenses are locked from normal edits and deletes.

Trip, participant, and expense changes write trip-scoped audit log rows with
before/after JSON where practical.
