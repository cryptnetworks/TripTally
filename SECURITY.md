# Security Policy

## Supported Versions

Security fixes are applied to the `main` branch and current Docker images published from `main`.

## Reporting a Vulnerability

Do not open a public issue for a suspected vulnerability.

Report privately to the repository maintainers with:

- Affected component or route
- Steps to reproduce
- Impact and expected result
- Relevant logs or screenshots with secrets removed

Maintainers will acknowledge valid reports, investigate, and coordinate a fix before public disclosure.

## Responsible Disclosure

- Do not publish exploit details before a fix is available.
- Do not access, modify, or delete data that is not yours.
- Do not run destructive tests against production deployments.
- Do not include passwords, tokens, MFA secrets, recovery codes, or session cookies in reports.

## Security Model Summary

- Provider OAuth access and refresh tokens are not stored.
- OAuth app-login handoff tokens are short-lived, single-use, and stored in HTTP-only cookies.
- Password reset, email verification, MFA session handoff, and OAuth handoff tokens are stored only as keyed HMAC digests.
- Protected server access validates the current session user against the database.
- Disabled or deleted users lose access on the next protected server request.
- State-changing requests include same-origin CSRF checks.
- Production security headers include CSP, HSTS, frame denial, content-type protection, referrer policy, permissions policy, and cross-origin opener policy.

## Automated Security Checks

The repository security workflow runs high-severity npm audit, Trivy filesystem scanning, and Trivy Docker image scanning. CodeQL is expected to run through GitHub default setup in repository settings.

`npm run security:audit` is configured to fail on high and critical advisories. Moderate advisories are reviewed separately when available fixes require breaking package changes.
