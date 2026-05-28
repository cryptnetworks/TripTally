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

## Residual Notes

The CSP permits inline scripts/styles for Next.js compatibility and the theme bootstrap script. If strict nonce/hash CSP support is added later, this can be tightened.
