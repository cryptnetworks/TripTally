#!/usr/bin/env sh
set -eu

ROOT_DIR="$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)"
cd "$ROOT_DIR"

log() {
  printf '%s\n' "$1"
}

fatal() {
  printf 'Error: %s\n' "$1" >&2
  exit 1
}

load_env() {
  if [ -f .env ]; then
    set -a
    # shellcheck disable=SC1091
    . ./.env
    set +a
  fi
}

require_var() {
  eval "value=\${$1:-}"
  [ -n "$value" ] || fatal "$1 is required"
}

load_env

require_var DOMAIN
require_var LETSENCRYPT_EMAIL

DNS_PROVIDER="${DNS_PROVIDER:-cloudflare}"
CERTBOT_STAGING="${CERTBOT_STAGING:-1}"
DNS_PROPAGATION_SECONDS="${DNS_PROPAGATION_SECONDS:-60}"

[ "$DNS_PROVIDER" = "cloudflare" ] || fatal "Only DNS_PROVIDER=cloudflare is wired by default. Swap the certbot image/plugin and script flags for another provider."

mkdir -p certbot nginx/conf.d

if [ ! -f certbot/cloudflare.ini ]; then
  require_var CLOUDFLARE_API_TOKEN
  umask 077
  printf 'dns_cloudflare_api_token = %s\n' "$CLOUDFLARE_API_TOKEN" > certbot/cloudflare.ini
  log "Created certbot/cloudflare.ini from CLOUDFLARE_API_TOKEN."
fi

chmod 600 certbot/cloudflare.ini

log "Creating temporary self-signed certificate for initial Nginx startup if needed..."
docker compose run --rm --entrypoint sh certbot -c "
  if [ ! -f /etc/letsencrypt/live/$DOMAIN/fullchain.pem ]; then
    mkdir -p /etc/letsencrypt/live/$DOMAIN
    openssl req -x509 -nodes -newkey rsa:2048 -days 1 \
      -keyout /etc/letsencrypt/live/$DOMAIN/privkey.pem \
      -out /etc/letsencrypt/live/$DOMAIN/fullchain.pem \
      -subj '/CN=$DOMAIN'
  fi
"

log "Starting Nginx with temporary certificate..."
docker compose up -d nginx

staging_arg=""
if [ "$CERTBOT_STAGING" = "1" ] || [ "$CERTBOT_STAGING" = "true" ]; then
  staging_arg="--staging"
  log "Using Let's Encrypt staging environment."
fi

log "Requesting Let's Encrypt certificate for $DOMAIN using DNS-01..."
docker compose run --rm certbot certonly \
  --dns-cloudflare \
  --dns-cloudflare-credentials /etc/letsencrypt/cloudflare.ini \
  --dns-cloudflare-propagation-seconds "$DNS_PROPAGATION_SECONDS" \
  --email "$LETSENCRYPT_EMAIL" \
  --agree-tos \
  --no-eff-email \
  --force-renewal \
  $staging_arg \
  -d "$DOMAIN"

log "Reloading Nginx with issued certificate..."
docker compose exec nginx nginx -s reload || docker compose up -d nginx

log "Certificate initialization complete for $DOMAIN."
