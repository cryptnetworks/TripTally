# Contributing

## Development

Use the same commands locally that CI runs:

```bash
npm install
npm run prisma:generate
npm run lint
npm run type-check
npm test
npm run build
```

For schema changes, add a Prisma migration and keep `prisma/schema.prisma`,
`prisma/migrations`, and generated client usage in sync.

## Code Style

- Keep server actions grouped by domain under `lib/actions/`.
- Keep calculation and business rules in `lib/`, not React components.
- Prefer server components unless interactivity requires a client component.
- Use Zod schemas from `lib/validation.ts` for incoming form data.
- Do not log passwords, tokens, reset links in production, or raw request bodies.

## Commits

Use short imperative commit messages:

```text
Add password reset token cleanup
Fix Docker startup validation
Refactor trip server actions
```

Mention migrations, env var changes, and deployment changes in the commit body
when they affect operators.
