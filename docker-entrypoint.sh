#!/bin/sh
set -eu

echo "Preparing TripTally container..."
echo "Starting with NODE_ENV=${NODE_ENV:-production}"

if [ -z "${DATABASE_URL:-}" ]; then
  export DATABASE_URL="file:/app/data/triptally.db"
fi

case "$DATABASE_URL" in
  file:*)
    DB_PATH="${DATABASE_URL#file:}"
    DB_DIR="$(dirname "$DB_PATH")"
    mkdir -p "$DB_DIR"
    ;;
esac

echo "Generating Prisma Client..."
npx prisma generate

echo "Applying Prisma migrations..."
npx prisma migrate deploy

echo "Starting TripTally..."
exec "$@"
