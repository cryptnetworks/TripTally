#!/usr/bin/env sh
set -eu

ROOT_DIR="$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)"
cd "$ROOT_DIR"

if [ -f .env ]; then
  set -a
  # shellcheck disable=SC1091
  . ./.env
  set +a
fi

[ -f certbot/cloudflare.ini ] || {
  echo "Error: certbot/cloudflare.ini is required for renewal." >&2
  exit 1
}

chmod 600 certbot/cloudflare.ini

docker compose run --rm certbot renew \
  --dns-cloudflare \
  --dns-cloudflare-credentials /etc/letsencrypt/cloudflare.ini

docker compose exec nginx nginx -s reload || docker compose up -d nginx
