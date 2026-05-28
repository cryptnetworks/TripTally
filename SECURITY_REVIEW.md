# Security Review: XSS, CSRF, OAuth, and Sessions

Date: 2026-05-28

## Findings and Remediations

### OAuth/session token handling

- Provider access tokens are not stored in the app database.
- OAuth callback handoff previously placed a local one-time app login token in the URL as `oauthToken`.
- The handoff now uses a short-lived, single-use, HTTP-only cookie instead.
- The cookie token is consumed by the credentials provider and invalidated in the database.
- Protected server access now validates the session user against the database and rejects missing or disabled users, so stale JWTs do not authorize protected pages/actions.
- OAuth account linking no longer sets the link cookie for cross-origin start requests.

### CSRF

- State-changing Server Actions now enforce same-origin checks using `Origin` or `Referer` where present.
- The custom login API rejects cross-origin posts.
- NextAuth continues to handle its own CSRF for built-in auth endpoints such as sign-out.
- Sensitive cookies use `SameSite=Lax`, `httpOnly` where applicable, and `secure` in production.

### XSS

- No unsafe user-controlled `dangerouslySetInnerHTML` rendering was found.
- Audit metadata and search/query strings are rendered as React text, not HTML.
- Login `callbackUrl` is now constrained to local relative paths to prevent unsafe redirects.
- A Content Security Policy was added with `frame-ancestors 'none'`, `object-src 'none'`, `base-uri 'self'`, and `form-action 'self'`.

### Security Headers

Configured globally:

- `Content-Security-Policy`
- `X-Frame-Options: DENY`
- `X-Content-Type-Options: nosniff`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy`
- `Strict-Transport-Security`

## Residual Notes

- Provider token revocation on logout is not implemented because provider access/refresh tokens are not stored.
- If provider token storage is added later, tokens must be encrypted at rest, scoped minimally, expired/rotated, and revoked on unlink/logout where the provider supports revocation.
- The CSP permits inline scripts/styles for Next.js compatibility and the existing theme bootstrap script. Tightening this further would require nonce/hash plumbing for framework and app inline scripts.
