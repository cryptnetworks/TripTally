# Repository Automation

TripTally includes GitHub automation for validation, Docker images, dependency updates, and security scanning.

## CI

The CI workflow runs on pushes and pull requests. It installs dependencies, validates configuration, validates Prisma, runs formatting checks, lint, TypeScript, unit/integration tests, e2e tests, and a production build.

Local equivalent:

```bash
npm run validate:config
npx prisma validate
npm run format:check
npm run lint
npm run typecheck
npm test
npm run test:e2e
npm run build
```

## Docker Image Publishing

The Docker workflow builds the app image and publishes to GitHub Container Registry from `main` and tags. Images are tagged by branch, SHA, and `latest` where applicable.

The repository README and wiki currently pin the published image by digest for reproducible deployments.

## Security Workflow

The security workflow runs:

- `npm run security:audit` for high and critical npm advisories.
- Trivy filesystem scan.
- Trivy Docker image scan.

CodeQL is expected to run through GitHub default setup in repository settings. The repo does not define an advanced CodeQL workflow because GitHub rejects advanced CodeQL SARIF uploads while default setup is enabled.

Moderate npm advisories are reviewed but do not currently fail the high-threshold audit command. Do not run `npm audit fix --force` without reviewing breaking changes.

## Dependency Review

Pull requests run GitHub dependency review and fail on vulnerable dependency changes at the configured threshold.

## Dependabot

Dependabot checks:

- npm packages
- GitHub Actions
- Docker base images

Minor and patch updates are grouped where practical. Security updates should be reviewed promptly and tested through CI before merge.

## Release Workflow

Version tags matching `v*.*.*` create a GitHub release with generated notes. Docker image publishing is handled by the Docker workflow for tag pushes.
