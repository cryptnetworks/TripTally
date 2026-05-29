# SeddleUp Rebrand and Rename Report

## Repository Rename

- Target repository name: `seddleup`.
- Fallback name if unavailable: `seddleup-app`.
- Documentation and GitHub issue template links now use the SeddleUp project name and the expected `cryptnetworks/seddleup` advisory URL.
- The remote GitHub repository was renamed to `cryptnetworks/seddleup`.
- The local `origin` remote was updated to `https://github.com/cryptnetworks/seddleup.git`.
- If this checkout is recreated elsewhere, use:

```bash
git remote set-url origin https://github.com/cryptnetworks/seddleup.git
```

## Filesystem Rename

- Target local project directory: `SeddleUp`.
- The checkout directory was renamed from `TripTally` to `SeddleUp` during this branch work.
- No tracked source files depend on the old absolute local checkout path.

## Files Renamed

- None in git. Compatibility-sensitive filenames such as Docker and Nginx config filenames were left unchanged.

## Directories Renamed

- Local filesystem checkout directory only: `TripTally` -> `SeddleUp`.

## Remaining Legacy References

These references are intentionally retained because they are technical identifiers, deployment compatibility points, or test-only fixtures:

| Reference                                                                                                   | Classification                  | Decision                                                                                     |
| ----------------------------------------------------------------------------------------------------------- | ------------------------------- | -------------------------------------------------------------------------------------------- |
| `package.json` and `package-lock.json` package name: `triptally`                                            | Should remain for compatibility | Avoids package/lockfile churn during a brand-only release.                                   |
| Docker service, container, and volume names such as `triptally` and `triptally_data`                        | Should remain for compatibility | Preserves current Compose, Cloudflare, and Nginx deployment paths.                           |
| SQLite database filenames such as `/app/data/triptally.db`                                                  | Should remain for compatibility | Renaming would require operator data migration and backup/restore guidance.                  |
| Environment variables with `TRIPTALLY_` prefixes used by Docker startup validation                          | Should remain for compatibility | Renaming would break existing deployments unless aliases and deprecation handling are added. |
| OAuth handoff cookie name `__Host-triptally.oauth-login-token`                                              | Requires migration              | Changing it can strand in-flight OAuth handoffs; do this with a compatibility window.        |
| Test hostnames, emails, fixture filenames, and secrets such as `triptally.test`                             | Safe to rename later            | Not user-facing, but broad test updates should be isolated from the rebrand.                 |
| `nginx/conf.d/triptally.conf` and Cloudflare tunnel service examples that depend on the Docker service name | Should remain for compatibility | Coupled to current Docker service names.                                                     |
| Historical running-issues entries that quote past verification commands                                     | Should remain for audit history | These are historical notes, not current branding.                                            |
| Git history/log entries under `.git`                                                                        | Should remain                   | Git logs are immutable historical metadata.                                                  |

## Decisions

- Database schema, migration history, Prisma model names, package identifiers, Docker identifiers, and environment variable names remain unchanged to avoid unnecessary migration and deployment churn.
- App-facing metadata, manifest, PWA assets, email templates, page copy, wiki branding, issue templates, and launch logs were updated to SeddleUp.
- Local CI image tags, the GitHub Actions publish target, and operator documentation use the `ghcr.io/cryptnetworks/seddleup` image path.

## Required Follow-Up

- Publish the first `ghcr.io/cryptnetworks/seddleup` image from the Docker workflow before using the updated pull commands in production.
- Consider a future major-version migration if internal package, cookie, database, Docker, or environment variable names need to move from `triptally` to `seddleup`.
- If internal test fixtures are renamed later, update fixtures, imports, test domains, and OAuth test config together.
