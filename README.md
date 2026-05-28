# TripTally

TripTally is a Docker-deployable Next.js app for tracking group trip expenses,
participants, balances, and settlement suggestions.

## Features

- Trip, participant, expense, balance, and settlement tracking
- Collaborative trip memberships with owner/admin/member/viewer permissions
- Member-created expenses with draft, submitted, disputed, approved, and settled states
- Credentials login with email verification and password reset
- Email-code or authenticator-app MFA
- Admin portal for users, auth providers, settings, and audit logs
- OAuth login and account linking for Google, GitHub, Discord, and Facebook
- Docker healthcheck at `/api/health`

## Screenshots

Screenshots are not committed yet. Add current dashboard, trip detail, account, and admin views here when a stable release UI is captured.

## Docker Image

Pinned GHCR image:

```bash
docker pull ghcr.io/cryptnetworks/triptally:sha-292a632@sha256:9a2387e29e29bf862a056619192a3cf3256b74a5d4fc67e97467321c43957207
```

## Required Configuration

Start from the Docker env example:

```bash
cp .env.docker.example .env
openssl rand -base64 32
openssl rand -base64 32
openssl rand -base64 32
```

Use separate generated values for `NEXTAUTH_SECRET`, `TOKEN_DIGEST_SECRET`, and
`AUTH_CONFIG_ENCRYPTION_KEY`.

Minimum local Docker values:

```env
NODE_ENV=production
DATABASE_URL=file:/app/data/triptally.db
NEXTAUTH_URL=http://localhost:3000
PUBLIC_APP_URL=http://localhost:3000
NEXTAUTH_SECRET=paste-generated-secret-here
TOKEN_DIGEST_SECRET=paste-generated-secret-here
AUTH_CONFIG_ENCRYPTION_KEY=paste-generated-secret-here
SMTP_ENABLED=false
```

For a public deployment, use the public HTTPS URL everywhere:

```env
NEXTAUTH_URL=https://app.example.com
AUTH_URL=https://app.example.com
PUBLIC_APP_URL=https://app.example.com
```

`TOKEN_DIGEST_SECRET` keys one-time token digests for password reset, email
verification, MFA session handoff, and OAuth login handoff tokens. Changing it
invalidates outstanding one-time tokens safely. `AUTH_CONFIG_ENCRYPTION_KEY`
encrypts stored OAuth provider secrets. Keep it backed up; losing it prevents
decrypting saved provider secrets.

See `.env.example` and `.env.docker.example` for the full variable list.

## Run With Docker

```bash
docker volume create triptally_data

docker run --name triptally \
  -p 3000:3000 \
  -v triptally_data:/app/data \
  --env-file .env \
  ghcr.io/cryptnetworks/triptally:sha-292a632@sha256:9a2387e29e29bf862a056619192a3cf3256b74a5d4fc67e97467321c43957207
```

Open `http://localhost:3000`.

The container starts as a non-root user, validates configuration, generates Prisma
Client, applies Prisma migrations, and then starts the Next.js production server.
SQLite data is stored in `/app/data`, so mount a persistent volume there.

Healthcheck:

```bash
curl http://localhost:3000/api/health
```

## Run With Docker Compose

The included Compose file is production-oriented. It builds the local Dockerfile by
default and runs TripTally privately on the Docker network.

```bash
docker compose up -d --build triptally
```

Compose mounts `triptally_data` at `/app/data`.

To use the pinned GHCR image with Compose instead of building locally, either edit
`docker-compose.yml` or override the service image in your deployment tooling:

```yaml
services:
  triptally:
    image: ghcr.io/cryptnetworks/triptally:sha-292a632@sha256:9a2387e29e29bf862a056619192a3cf3256b74a5d4fc67e97467321c43957207
    build: null
```

## Public Deployment Options

TripTally supports two Docker Compose deployment profiles:

- `nginx` - public Nginx reverse proxy with Certbot DNS-01 certificates.
- `cloudflare` - Cloudflare Tunnel with no public inbound ports.

Set one profile in `.env`:

```env
COMPOSE_PROFILES=cloudflare
```

or:

```env
COMPOSE_PROFILES=nginx
```

Then start the selected deployment:

```bash
docker compose up -d --build
```

## Cloudflare Tunnel

Set:

```env
COMPOSE_PROFILES=cloudflare
DOMAIN=app.example.com
PUBLIC_APP_URL=https://app.example.com
NEXTAUTH_URL=https://app.example.com
AUTH_URL=https://app.example.com
CLOUDFLARE_TUNNEL_TOKEN=your-cloudflare-tunnel-token
```

In Cloudflare Zero Trust, create a tunnel and public hostname:

- Hostname: `app.example.com`
- Service: `http://triptally:3000`

Start:

```bash
docker compose --profile cloudflare up -d --build
```

No public inbound ports are required. The `cloudflared` container connects
outbound to Cloudflare and forwards traffic to the private `triptally` service.

## Nginx And Let's Encrypt

Set:

```env
COMPOSE_PROFILES=nginx
DOMAIN=app.example.com
PUBLIC_APP_URL=https://app.example.com
NEXTAUTH_URL=https://app.example.com
AUTH_URL=https://app.example.com
LETSENCRYPT_EMAIL=admin@example.com
CERTBOT_STAGING=1
DNS_PROVIDER=cloudflare
CLOUDFLARE_API_TOKEN=your-cloudflare-token
```

The Cloudflare API token must have `Zone:DNS:Edit` and `Zone:Zone:Read` for the
zone that owns `DOMAIN`.

Issue staging certificates first:

```bash
docker compose up -d triptally
./scripts/init-letsencrypt.sh
docker compose --profile nginx up -d
```

When staging works, set:

```env
CERTBOT_STAGING=0
```

Then rerun:

```bash
./scripts/init-letsencrypt.sh
docker compose --profile nginx up -d
```

Manual renewal:

```bash
./scripts/renew-certs.sh
```

## Email And MFA

SMTP is optional but recommended for production. TripTally uses email for account
verification, password reset links, and email two-factor codes.

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

Use `SMTP_SECURE=false` for port `587` with STARTTLS. Use `SMTP_SECURE=true` only
for implicit TLS ports such as `465`.

Two-factor authentication can be disabled, set to email codes, or set to
authenticator-app TOTP from the account settings page.

## Admin And OAuth Providers

The first registered user becomes the bootstrap administrator. Admin pages are
available under `/admin`.

OAuth provider callback URLs:

```txt
https://app.example.com/api/auth/oauth/google/callback
https://app.example.com/api/auth/oauth/github/callback
https://app.example.com/api/auth/oauth/discord/callback
https://app.example.com/api/auth/oauth/facebook/callback
```

Provider client secrets are encrypted with `AUTH_CONFIG_ENCRYPTION_KEY`.

## Collaborative Expenses

Trip owners are recorded as `owner` members when trips are created. Owners and
trip admins can manage trip settings, participants, and all expenses. Members can
view trip expenses and balances, add their own expenses, and edit or delete their
own expenses until those expenses are marked `settled`. Viewers can read trip
details without changing the ledger.

Expense statuses control visibility and balances:

- `draft` is visible only to the creator and trip managers and is excluded from
  balances.
- `submitted`, `approved`, `disputed`, and `settled` are visible to trip members
  and included in balances.
- `settled` expenses are locked from normal edits and deletes.

Participant records can link to app users by matching email. Linked users become
trip members automatically when a manager adds or updates the participant.
Expense, participant, and trip changes are written to the audit log with trip
context.

## Local Development

Use Node.js 22.

```bash
npm install
cp .env.example .env
npm run prisma:generate
npm run prisma:migrate
npm run dev
```

Open `http://localhost:3000`.

## Testing And Quality Checks

```bash
npm run format:check
npm run lint
npm run typecheck
npm test
npm run test:e2e
npm run build
npm run security:audit
docker build -t triptally:ci .
```

End-to-end tests use Playwright:

```bash
npx playwright install
npm run test:e2e
```

Playwright forces local `NEXTAUTH_URL` and `PUBLIC_APP_URL` values when it starts its own dev server.

## Repository Automation

GitHub Actions provide CI, Docker image publishing, dependency review, security scanning, and release creation. Dependabot checks npm packages, GitHub Actions, and Docker base images weekly.

The security workflow runs high-severity npm audit, Trivy filesystem scanning, and Trivy Docker image scanning. CodeQL is expected to run through GitHub default setup in repository settings.

Current dependency remediation replaces Nodemailer with EmailJS for direct SMTP sending and uses scoped npm overrides for vulnerable transitive packages that upstream dependencies have not yet bumped.

## Backups

Back up SQLite:

```bash
mkdir -p backups
docker run --rm \
  -v triptally_data:/data \
  -v "$PWD/backups:/backup" \
  alpine sh -c 'cp /data/triptally.db /backup/triptally-$(date +%Y%m%d-%H%M%S).db'
```

Restore SQLite:

```bash
docker stop triptally
docker run --rm \
  -v triptally_data:/data \
  -v "$PWD/backups:/backup" \
  alpine sh -c 'cp /backup/triptally.db /data/triptally.db'
docker start triptally
```

## Updates

Pull the new image, recreate the container, and keep the same volume:

```bash
docker pull ghcr.io/cryptnetworks/triptally:sha-292a632@sha256:9a2387e29e29bf862a056619192a3cf3256b74a5d4fc67e97467321c43957207
docker rm -f triptally
docker run --name triptally \
  -p 3000:3000 \
  -v triptally_data:/app/data \
  --env-file .env \
  ghcr.io/cryptnetworks/triptally:sha-292a632@sha256:9a2387e29e29bf862a056619192a3cf3256b74a5d4fc67e97467321c43957207
```

The startup entrypoint applies database migrations automatically.

## Troubleshooting

- If the container exits immediately, check `NEXTAUTH_SECRET`,
  `TOKEN_DIGEST_SECRET`, `AUTH_CONFIG_ENCRYPTION_KEY`, and `DATABASE_URL`.
- If OAuth redirects to localhost or `0.0.0.0`, set `PUBLIC_APP_URL`,
  `NEXTAUTH_URL`, and `AUTH_URL` to the public HTTPS URL.
- If Cloudflare Tunnel starts but the site is unavailable, confirm the public
  hostname service is exactly `http://triptally:3000`.
- If Nginx certificate issuance fails, verify the Cloudflare token permissions and
  DNS propagation.
- If SQLite is missing after recreation, confirm `/app/data` is mounted to the
  same persistent Docker volume.

## Security Notes

- Sessions use NextAuth JWT cookies.
- Production cookies are secure and HTTP-only where applicable.
- State-changing requests include same-origin CSRF checks.
- OAuth app-login handoff tokens are short-lived, single-use, and stored in an
  HTTP-only cookie.
- Security headers are configured in `next.config.mjs`.
- Report vulnerabilities privately. See `SECURITY.md`.
