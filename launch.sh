#!/usr/bin/env bash
set -euo pipefail

APP="${1:-next}"
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT_DIR"

error() {
  printf "Error: %s\n" "$1" >&2
  exit 1
}

info() {
  printf "%s\n" "$1"
}

command_exists() {
  command -v "$1" >/dev/null 2>&1
}

ensure_env() {
  if [ ! -f ".env" ]; then
    if [ -f ".env.example" ]; then
      cp .env.example .env
      info "Created .env from .env.example. Review NEXTAUTH_SECRET before production use."
    else
      error ".env is missing and .env.example was not found."
    fi
  fi
}

ensure_node() {
  command_exists npm || error "npm is not installed or not on PATH."
  command_exists npx || error "npx is not installed or not on PATH."

  if [ ! -d "node_modules" ]; then
    info "Installing npm dependencies..."
    npm install || error "npm install failed."
  fi
}

ensure_prisma_client() {
  info "Generating Prisma Client..."
  npx prisma generate || error "Prisma Client generation failed."
}

ensure_database() {
  info "Applying database migrations..."
  npx prisma migrate deploy || error "Database migration failed. Run './launch.sh migrate' for interactive migration details."
}

run_next() {
  ensure_env
  ensure_node
  ensure_prisma_client
  ensure_database

  info "Starting TripTally Next.js app at http://localhost:3000"
  npm run dev
}

run_migrate() {
  ensure_env
  ensure_node
  ensure_prisma_client

  info "Running Prisma migrations..."
  npx prisma migrate dev || error "Prisma migration failed."
}

run_seed() {
  ensure_env
  ensure_node
  ensure_prisma_client

  info "Seeding demo data..."
  npm run seed || error "Seed command failed."
}

run_flask() {
  command_exists python3 || command_exists python || error "Python is not installed or not on PATH."
  PYTHON_BIN="$(command -v python3 || command -v python)"

  if [ ! -d "venv" ]; then
    info "Creating Python virtual environment..."
    "$PYTHON_BIN" -m venv venv || error "Could not create virtual environment."
  fi

  # shellcheck disable=SC1091
  source venv/bin/activate

  if [ -f "requirements.txt" ]; then
    info "Installing Python dependencies..."
    pip install -r requirements.txt || error "Python dependency install failed."
  fi

  info "Starting legacy Flask app..."
  python run.py
}

case "$APP" in
  next|dev)
    run_next
    ;;
  migrate|db)
    run_migrate
    ;;
  seed)
    run_seed
    ;;
  flask|legacy)
    run_flask
    ;;
  help|-h|--help)
    cat <<'HELP'
Usage: ./launch.sh [next|migrate|seed|flask]

Commands:
  next      Start the Next.js app. Default.
  migrate   Run Prisma migrate dev.
  seed      Seed demo data.
  flask     Start the legacy Flask app.
HELP
    ;;
  *)
    error "Unknown command '$APP'. Run ./launch.sh help."
    ;;
esac
