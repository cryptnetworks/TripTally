# Running Issues Log

## Issue 1: Docker and CI npm install peer dependency failure

- Date encountered: 2026-05-28
- Error summary: `npm install` failed with `ERESOLVE` because `next-auth@4.24.14` requires optional peer `nodemailer@^7.0.7`, while the root project requested `nodemailer@^8.0.9`.
- Root cause: Nodemailer was upgraded past the peer range supported by the current NextAuth version.
- Files changed: `package.json`, `package-lock.json`, `Dockerfile`.
- Fix applied: Pinned Nodemailer to `^7.0.13`, regenerated the lockfile, and changed Docker dependency installation from `npm install` to `npm ci`.
- Verification commands: `npm ci`, `npm run build`, `docker build -t triptally:latest .`.
- Status: Fixed.

## Issue 2: Docker builds were not using the lockfile strictly

- Date encountered: 2026-05-28
- Error summary: Docker used `npm install` after copying `package.json` and `package-lock.json`.
- Root cause: `npm install` can resolve dependencies differently from CI and can surface peer resolution drift during image builds.
- Files changed: `Dockerfile`.
- Fix applied: Replaced `npm install --no-audit --no-fund --loglevel=error` with `npm ci --no-audit --no-fund --loglevel=error`.
- Verification commands: `docker build -t triptally:latest .`, `docker compose build`.
- Status: Fixed.

## Issue 3: CodeQL default setup conflicts with advanced workflow

- Date encountered: 2026-05-28
- Error summary: GitHub rejected CodeQL SARIF with `CodeQL analyses from advanced configurations cannot be processed when the default setup is enabled`.
- Root cause: GitHub CodeQL default setup and a repo-managed advanced CodeQL workflow were both active.
- Files changed: `.github/workflows/security.yml`, `SECURITY.md`, `docs/wiki/Repository-Automation.md`, `docs/wiki/Security-Model.md`.
- Fix applied: Removed the custom CodeQL job from the security workflow and documented that CodeQL is expected to run through GitHub default setup.
- Verification commands: YAML review and workflow consistency check. Full SARIF acceptance must be verified by the next GitHub Actions run.
- Status: Fixed in repository configuration; pending hosted Actions confirmation.

## Issue 4: Trivy image scan depended on a failing Docker build

- Date encountered: 2026-05-28
- Error summary: Trivy image scan could not run because the Docker image failed to build.
- Root cause: Same Nodemailer peer dependency conflict as Issue 1.
- Files changed: `package.json`, `package-lock.json`, `Dockerfile`, `.github/workflows/security.yml`.
- Fix applied: Resolved the dependency conflict and made Docker installs reproducible with `npm ci`.
- Verification commands: `docker build -t triptally:latest .`, `npm run security:scan`.
- Status: Fixed.
