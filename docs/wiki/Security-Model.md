# Security Model

## Sessions

- NextAuth uses JWT sessions.
- Production cookies are secure and HTTP-only where applicable.
- Protected server access validates the current session user against the database.
- Deleted or disabled users are rejected even if a stale JWT exists.

## OAuth

- Provider access tokens and refresh tokens are not stored.
- OAuth login uses a local short-lived, single-use handoff token.
- The handoff token is stored in an HTTP-only cookie and consumed by the credentials provider.
- Password reset, email verification, MFA session handoff, and OAuth handoff tokens are stored only as keyed HMAC digests.
- OAuth account linking requires a current app session.

## CSRF

- State-changing Server Actions enforce same-origin checks using `Origin` or `Referer` when present.
- The custom login API rejects cross-origin posts.
- NextAuth handles CSRF for its built-in endpoints.

## XSS

- User-controlled values are rendered as React text, not raw HTML.
- Audit metadata is rendered as text in a `pre` block.
- Login callback redirects are limited to local relative paths.
- The app sets a Content Security Policy.

## Security Headers

Configured globally:

- `Content-Security-Policy`
- `X-Frame-Options: DENY`
- `X-Content-Type-Options: nosniff`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy`
- `Strict-Transport-Security`
- `Cross-Origin-Opener-Policy: same-origin`

## Residual Notes

The CSP permits inline scripts/styles for Next.js compatibility and the theme bootstrap script. Development mode may also require browser eval support for React diagnostics, but production should not rely on `unsafe-eval`. If strict nonce/hash CSP support is added later, this can be tightened.

## Security Testing

Automated coverage includes:

- Unit tests that verify security headers remain configured.
- Unit tests that verify user-controlled text is escaped by React rendering.
- API/session tests for stale sessions, disabled users, MFA, CSRF, and role checks.
- GitHub Actions security workflow for high-severity npm audit, CodeQL, Trivy filesystem scan, and Trivy Docker image scan.

`npm run security:audit` currently fails only high or critical npm advisories. Moderate advisories are reviewed separately because some upstream fixes require breaking changes.
