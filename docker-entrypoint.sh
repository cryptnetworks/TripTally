#!/bin/sh
set -eu

log() {
  level="$1"
  event="$2"
  message="$3"
  printf '{"time":"%s","level":"%s","event":"%s","message":"%s"}\n' "$(date -u +"%Y-%m-%dT%H:%M:%SZ")" "$level" "$event" "$message"
}

fatal() {
  log "error" "startup.fatal" "$1"
  exit 1
}

strip_quotes() {
  value="$1"
  case "$value" in
    \"*\")
      value="${value#\"}"
      value="${value%\"}"
      ;;
    \'*\')
      value="${value#\'}"
      value="${value%\'}"
      ;;
  esac
  printf "%s" "$value"
}

retry() {
  label="$1"
  attempts="$2"
  delay="$3"
  shift 3

  count=1
  while [ "$count" -le "$attempts" ]; do
    if "$@"; then
      log "info" "startup.step" "$label succeeded"
      return 0
    fi

    if [ "$count" -eq "$attempts" ]; then
      fatal "$label failed after $attempts attempts"
    fi

    log "warn" "startup.retry" "$label failed on attempt $count; retrying in ${delay}s"
    sleep "$delay"
    count=$((count + 1))
  done
}

log "info" "startup.begin" "Preparing TripTally container"
log "info" "startup.env" "NODE_ENV=${NODE_ENV:-production}"

if [ -z "${DATABASE_URL:-}" ]; then
  export DATABASE_URL="file:/app/data/triptally.db"
else
  DATABASE_URL="$(strip_quotes "$DATABASE_URL")"
  export DATABASE_URL
fi

if [ -n "${NEXTAUTH_URL:-}" ]; then
  NEXTAUTH_URL="$(strip_quotes "$NEXTAUTH_URL")"
  export NEXTAUTH_URL
fi

if [ -n "${NEXTAUTH_SECRET:-}" ]; then
  NEXTAUTH_SECRET="$(strip_quotes "$NEXTAUTH_SECRET")"
  export NEXTAUTH_SECRET
fi

case "$DATABASE_URL" in
  file:*)
    DB_PATH="${DATABASE_URL#file:}"
    case "$DB_PATH" in
      /*)
        ;;
      *)
        if [ "${TRIPTALLY_DOCKER:-}" = "1" ]; then
          DB_PATH="${TRIPTALLY_SQLITE_PATH:-/app/data/triptally.db}"
          export DATABASE_URL="file:${DB_PATH}"
          log "warn" "startup.sqlite" "Rewriting relative SQLite DATABASE_URL to ${DATABASE_URL} for Docker persistence"
        else
          fatal "SQLite DATABASE_URL must use an absolute path in production containers. Use file:/app/data/triptally.db."
        fi
        ;;
    esac
    DB_DIR="$(dirname "$DB_PATH")"
    mkdir -p "$DB_DIR"
    touch "$DB_DIR/.write-test" 2>/dev/null || fatal "SQLite directory is not writable: $DB_DIR"
    rm -f "$DB_DIR/.write-test"
    log "info" "startup.sqlite" "Using SQLite database at $DB_PATH"
    ;;
esac

if [ -z "${NEXTAUTH_URL:-}" ]; then
  export NEXTAUTH_URL="http://localhost:${PORT:-3000}"
  log "warn" "startup.auth" "NEXTAUTH_URL was not set; defaulting to ${NEXTAUTH_URL}"
fi

case "${NEXTAUTH_SECRET:-}" in
  ""|"replace-with-a-long-random-secret"|"generate-a-long-random-secret-before-running-docker"|"paste-generated-secret-here")
    if [ "${TRIPTALLY_ALLOW_INSECURE_SECRET:-}" != "1" ]; then
      fatal "NEXTAUTH_SECRET must be set to a real random value. Generate one with: openssl rand -base64 32"
    fi
    log "warn" "startup.auth" "Using insecure NEXTAUTH_SECRET because TRIPTALLY_ALLOW_INSECURE_SECRET=1"
    ;;
esac

retry "Prisma Client generation" 2 2 npx prisma generate
retry "Config validation" 2 2 npm run validate:config
retry "Prisma migrations" 5 3 npx prisma migrate deploy

log "info" "startup.ready" "Starting TripTally"
exec "$@"
