# Configuration

TripTally reads configuration from environment variables. Docker deployments should start from `.env.docker.example`.

## Required Values

```env
NODE_ENV=production
DATABASE_URL=file:/app/data/triptally.db
NEXTAUTH_URL=https://app.example.com
PUBLIC_APP_URL=https://app.example.com
NEXTAUTH_SECRET=generate-a-long-random-secret
TOKEN_DIGEST_SECRET=generate-a-long-random-secret
AUTH_CONFIG_ENCRYPTION_KEY=generate-a-long-random-secret
```

`AUTH_URL` should also match the public URL when deployed behind a proxy:

```env
AUTH_URL=https://app.example.com
```

## Secrets

Generate separate values:

```bash
openssl rand -base64 32
openssl rand -base64 32
openssl rand -base64 32
```

- `NEXTAUTH_SECRET` signs NextAuth session tokens.
- `TOKEN_DIGEST_SECRET` keys stored one-time token digests.
- `AUTH_CONFIG_ENCRYPTION_KEY` encrypts saved OAuth provider client secrets.

Changing `TOKEN_DIGEST_SECRET` invalidates outstanding password reset, email verification, MFA session handoff, and OAuth handoff tokens. Back up `AUTH_CONFIG_ENCRYPTION_KEY`. Losing it prevents decrypting stored provider secrets.

## Public URL Values

For public deployments, these should all be the public HTTPS URL:

```env
NEXTAUTH_URL=https://app.example.com
AUTH_URL=https://app.example.com
PUBLIC_APP_URL=https://app.example.com
```

If OAuth redirects to `localhost`, HTTP, or `0.0.0.0`, these values are usually wrong or missing.

## Compose Profiles

```env
COMPOSE_PROFILES=cloudflare
```

or:

```env
COMPOSE_PROFILES=nginx
```

Leave `COMPOSE_PROFILES` empty only when running the private app container without a public deployment profile.

## SMTP

SMTP is optional but recommended for production:

```env
SMTP_ENABLED=true
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-smtp-username
SMTP_PASSWORD=your-smtp-password
SMTP_FROM=no-reply@app.example.com
EMAIL_APP_NAME="Trip Tally"
PASSWORD_RESET_TOKEN_MINUTES=45
```

Use `SMTP_SECURE=false` for port `587` with STARTTLS. Use `SMTP_SECURE=true` for implicit TLS ports such as `465`.
