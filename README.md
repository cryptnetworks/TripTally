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
- Email-based password reset with secure single-use tokens
- First registered user becomes the bootstrap administrator
- Admin portal for users, auth providers, settings, and audit logs
- Configurable OAuth provider records for Google, GitHub, Discord, and Facebook
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
- Security headers, PWA manifest, offline fallback, and Docker-ready startup validation
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
npm run format:check
npm run type-check
npm run test:unit
npm run test:integration
npm run build
```

## Account Email And Two-Factor Auth

SMTP email is optional for local development, but production accounts should enable it. Trip Tally uses transactional email for account verification, password reset links, and email-based two-factor sign-in codes. Leave `SMTP_ENABLED=false` only when you are developing locally; development mode logs verification and reset links to stdout for testing.

Use SMTP credentials from a provider such as Resend, Postmark, Mailgun, SendGrid, or a traditional SMTP host:

```env
SMTP_ENABLED=true
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-smtp-username
SMTP_PASSWORD=your-smtp-password
SMTP_FROM=no-reply@your-domain.example
EMAIL_APP_NAME="Trip Tally"
PASSWORD_RESET_TOKEN_MINUTES=45
```

For Mailgun and most SMTP providers on port `587`, keep `SMTP_SECURE=false`; that port uses STARTTLS. Use `SMTP_SECURE=true` only for implicit TLS ports such as `465`.

New users must verify their email before login. Password reset and email verification tokens are generated with secure random bytes, stored only as SHA-256 hashes, expire, and are marked used after success. Two-factor authentication can be disabled, set to email codes, or set to authenticator-app TOTP from the account settings page.

## Admin And SSO

The first registered user is promoted to `admin` automatically. Later users receive the configured default role, initially `user`. Admin routes live under `/admin` and are protected server-side with RBAC helpers.

Admin sections:

- `/admin` - system overview and recent audit events
- `/admin/users` - user search, role changes, disable/enable, password reset, deletion
- `/admin/auth` - OAuth provider configuration and callback URLs
- `/admin/settings` - local auth, registration, email verification, allowed domains, default role
- `/admin/audit` - searchable audit events

OAuth callback URLs:

```txt
https://your-domain.com/api/auth/oauth/google/callback
https://your-domain.com/api/auth/oauth/github/callback
https://your-domain.com/api/auth/oauth/discord/callback
https://your-domain.com/api/auth/oauth/facebook/callback
```

Provider client secrets are encrypted before storage. Set a long random value for:

```env
AUTH_CONFIG_ENCRYPTION_KEY=
```

If the key is missing in production, startup config validation fails. Keep the key backed up; losing it prevents decrypting stored provider secrets.

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

Pull the published GHCR image:

```bash
docker pull ghcr.io/cryptnetworks/triptally:sha-292a632@sha256:9a2387e29e29bf862a056619192a3cf3256b74a5d4fc67e97467321c43957207
```

Build the production image:

```bash
docker build -t triptally .
```

For local Docker SQLite storage, set Docker-friendly values in `.env`:

```env
DATABASE_URL=file:/app/data/triptally.db
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=paste-generated-secret-here
```

You can start from the Docker example file:

```bash
cp .env.docker.example .env
openssl rand -base64 32
```

Paste the generated value into `NEXTAUTH_SECRET`.

Run the app with a persistent SQLite volume:

```bash
docker run --name triptally \
  -p 3000:3000 \
  -v triptally_data:/app/data \
  --env-file .env \
  ghcr.io/cryptnetworks/triptally:sha-292a632@sha256:9a2387e29e29bf862a056619192a3cf3256b74a5d4fc67e97467321c43957207
```

Open `http://localhost:3000`.

On startup the container creates `/app/data` when needed, validates required auth/database environment variables, generates Prisma Client, runs `npx prisma migrate deploy` with retries, and then starts the Next.js production server with `npm start`.
If a Docker container receives a local development value like `DATABASE_URL="file:./dev.db"`, the startup script rewrites it to `file:/app/data/triptally.db` so SQLite stays inside the mounted volume.
Docker also checks `GET /api/health` every 30 seconds.

Docker Compose is also supported:

```bash
docker compose up --build -d triptally
```

Compose mounts the same `triptally_data` volume at `/app/data`. The Compose file is production-oriented: TripTally is private on the Docker network. Enable either the `nginx` profile for a traditional public reverse proxy or the `cloudflare` profile for Cloudflare Tunnel.

If `docker compose up -d` only starts `triptally`, no deployment profile is enabled. Set one of these in `.env`:

```env
COMPOSE_PROFILES=nginx
```

or:

```env
COMPOSE_PROFILES=cloudflare
```

Then run:

```bash
docker compose up -d --build
```

To recreate the container while keeping the SQLite database:

```bash
docker rm -f triptally
docker run --name triptally \
  -p 3000:3000 \
  -v triptally_data:/app/data \
  --env-file .env \
  ghcr.io/cryptnetworks/triptally:sha-292a632@sha256:9a2387e29e29bf862a056619192a3cf3256b74a5d4fc67e97467321c43957207
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

## Production Deployment Modes

TripTally supports two production deployment paths:

1. Traditional reverse proxy with Nginx, Certbot, Let's Encrypt, and DNS-01 validation.
2. Cloudflare Tunnel with no public inbound ports on the server.

Both modes keep the TripTally app private inside the Docker network on `triptally:3000`.

## Mode 1: Nginx And Certbot SSL

The Nginx Compose profile runs:

- `triptally`: the private Next.js app on internal port 3000.
- `nginx`: public reverse proxy on ports 80 and 443.
- `certbot`: Let's Encrypt certificate issuance and renewal using DNS-01.

Certificates persist in Docker volumes:

- `certbot_etc:/etc/letsencrypt`
- `certbot_var:/var/lib/letsencrypt`

DNS setup:

1. Create an `A` record for your domain, for example `app.example.com`, pointing to the server's public IPv4 address.
2. Optional: create an `AAAA` record if the server has public IPv6.
3. Wait for DNS propagation before requesting a production certificate.

Cloudflare token setup:

1. In Cloudflare, create an API token scoped to the zone that owns `DOMAIN`.
2. Grant `Zone:DNS:Edit` and `Zone:Zone:Read`.
3. Put the token in `.env` as `CLOUDFLARE_API_TOKEN`, or copy `certbot/cloudflare.ini.example` to `certbot/cloudflare.ini` and set the token there.
4. Keep `certbot/cloudflare.ini` private. It is ignored by git and the scripts set mode `600`.

Production `.env` example:

```env
NODE_ENV=production
DATABASE_URL=file:/app/data/triptally.db
DOMAIN=app.example.com
NEXTAUTH_URL=https://app.example.com
AUTH_URL=https://app.example.com
NEXTAUTH_SECRET=generate-a-long-random-secret
LETSENCRYPT_EMAIL=admin@example.com
CERTBOT_STAGING=1
DNS_PROVIDER=cloudflare
CLOUDFLARE_API_TOKEN=your-cloudflare-token
SMTP_ENABLED=false
```

Use staging first to avoid Let's Encrypt rate limits:

```bash
docker compose up -d triptally
./scripts/init-letsencrypt.sh
docker compose --profile nginx up -d
```

When staging works, switch to production certificates:

```bash
# edit .env
CERTBOT_STAGING=0

./scripts/init-letsencrypt.sh
docker compose --profile nginx up -d
```

Manual certificate renewal:

```bash
./scripts/renew-certs.sh
```

Example cron entry for twice-daily renewal checks:

```cron
17 3,15 * * * cd /path/to/TripTally && ./scripts/renew-certs.sh >> /var/log/triptally-certbot.log 2>&1
```

Nginx behavior:

- HTTP redirects to HTTPS.
- HTTPS proxies to `triptally:3000`.
- WebSocket upgrade headers are supported.
- Proxy headers include `Host`, `X-Real-IP`, `X-Forwarded-For`, and `X-Forwarded-Proto`.
- Security headers include HSTS, `X-Content-Type-Options`, `X-Frame-Options`, and `Referrer-Policy`.
- Gzip is enabled for common text responses.

Troubleshooting:

- If Certbot cannot validate DNS, confirm the Cloudflare token has `DNS:Edit` and is scoped to the correct zone.
- If the certificate is issued for staging, browsers will show it as untrusted. Set `CERTBOT_STAGING=0` and rerun `./scripts/init-letsencrypt.sh`.
- If Nginx fails before the first certificate is issued, rerun `./scripts/init-letsencrypt.sh`; it creates a temporary self-signed certificate before requesting the real one.
- If auth callbacks point to HTTP or localhost, verify `NEXTAUTH_URL` and `AUTH_URL` are both set to `https://${DOMAIN}`.
- If DNS changes were recent, increase `DNS_PROPAGATION_SECONDS`, for example `DNS_PROPAGATION_SECONDS=120`.

## Mode 2: Cloudflare Tunnel

Cloudflare Tunnel publishes TripTally without opening inbound ports 80 or 443 on the server. Cloudflare manages public HTTPS and forwards requests through the `cloudflared` container to the private app service.

Cloudflare Tunnel architecture:

- `triptally`: private Next.js app on internal port 3000.
- `cloudflared`: outbound-only tunnel client.
- Public HTTPS terminates at Cloudflare.
- Tunnel route forwards `app.example.com` to `http://triptally:3000`.

Cloudflare Tunnel `.env` example:

```env
NODE_ENV=production
DATABASE_URL=file:/app/data/triptally.db
DOMAIN=app.example.com
PUBLIC_APP_URL=https://app.example.com
NEXTAUTH_URL=https://app.example.com
AUTH_URL=https://app.example.com
NEXTAUTH_SECRET=generate-a-long-random-secret
CLOUDFLARE_TUNNEL_TOKEN=your-cloudflare-tunnel-token
SMTP_ENABLED=false
```

Cloudflare Zero Trust setup:

1. Create a tunnel in Cloudflare Zero Trust.
2. Add a public hostname:
   - Hostname: `app.example.com`
   - Service: `http://triptally:3000`
3. Copy the tunnel token into `.env` as `CLOUDFLARE_TUNNEL_TOKEN`.
4. Make sure `NEXTAUTH_URL`, `AUTH_URL`, and `PUBLIC_APP_URL` all use `https://app.example.com`.

Start the Cloudflare Tunnel deployment:

```bash
docker compose --profile cloudflare up -d --build
```

No public inbound ports are required for Cloudflare Tunnel. The `cloudflared` container makes an outbound connection to Cloudflare and shares the Docker network with `triptally`.

Optional config-file mode:

`cloudflare/config.yml.example` shows the equivalent tunnel configuration:

```yaml
tunnel: triptally
credentials-file: /etc/cloudflared/credentials.json

ingress:
  - hostname: app.example.com
    service: http://triptally:3000
  - service: http_status:404
```

The default Compose service uses token mode because it is simpler to deploy and avoids mounting Cloudflare credential JSON. To switch to config-file mode later, mount `cloudflare/config.yml` and `cloudflare/credentials.json`, then replace the `cloudflared` command with `tunnel --no-autoupdate run triptally`.

Cloudflare Tunnel troubleshooting:

- If the tunnel starts but the app is unavailable, confirm the public hostname service is exactly `http://triptally:3000`.
- If auth redirects to localhost or HTTP, fix `NEXTAUTH_URL`, `AUTH_URL`, and `PUBLIC_APP_URL`.
- If the container exits immediately, rotate/copy a fresh `CLOUDFLARE_TUNNEL_TOKEN`.
- Do not also run the `nginx` profile unless you intentionally want both deployment paths active.

Production hardening included in the app:

- NextAuth uses JWT sessions, secure cookies in production, `sameSite=lax`, and HTTP-only session/CSRF cookies.
- Credential login and registration use simple in-memory rate limits. For multi-container deployments, replace `lib/rate-limit.ts` with Redis or another shared store.
- All server actions validate route ids and form payloads with Zod.
- `app/error.tsx` and `app/not-found.tsx` provide production-safe error and missing-page views.
- `/api/health` checks database connectivity and is used by the Docker healthcheck.
- Logs are JSON lines on stdout/stderr for container log collection.
- `next.config.mjs` applies security headers including `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`, and a restrictive `Permissions-Policy`.
- `npm run validate:config` checks required production configuration and is run automatically by the Docker entrypoint.
- TripTally includes a PWA manifest, app icons, and an offline fallback page at `/offline`.

SQLite backup:

```bash
docker run --rm \
  -v triptally_data:/data \
  -v "$PWD/backups:/backup" \
  alpine sh -c 'cp /data/triptally.db /backup/triptally-$(date +%Y%m%d-%H%M%S).db'
```

SQLite restore:

```bash
docker run --rm \
  -v triptally_data:/data \
  -v "$PWD/backups:/backup" \
  alpine sh -c 'cp /backup/triptally.db /data/triptally.db'
```

Stop the app before restoring SQLite files.

CI/CD:

- `.github/workflows/ci.yml` runs config validation, Prisma validation, migrations, lint, type checks, Vitest, Next.js production build, and Docker build validation.

Before a production release, run:

```bash
npm install
npm run prisma:generate
npm run validate:config
npm run lint
npm run type-check
npm test
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
