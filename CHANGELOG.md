# Changelog

All notable changes to the `0.1.0-alpha` series are recorded here.

## Unreleased — `0.1.0-alpha.1`

### Example application

- Expanded the official example into an authenticated SQLite task CRUD with JWT login, per-user ownership and an end-to-end disposable-database smoke test.

### Stabilization

- Unified all publishable packages under version `0.1.0-alpha.1` and Bun `>=1.4.0`.
- Froze the implemented public surface for the alpha release.
- Corrected configuration-file merging and environment override precedence.
- Isolated environment, filesystem and prototype mutations in tests.
- Registered HTTP contexts with the application lifecycle so draining can wait for active requests.
- Added HTTP contract tests for input, responses, middleware, routing, exceptions, headers and disposal.
- Added real-server HTTP integration coverage for discovery, protocol responses, health/readiness, streamed-request draining and port release.
- Removed application-owned process signal listeners after shutdown or failed boot to prevent lifecycle leaks.
- Expanded validation contract coverage.
- Standardized Bun TypeScript-source package entrypoints and declaration exports.
- Removed tests and TypeScript build metadata from package tarballs.
- Added isolated installation, type-check and runtime validation for all package tarballs.
- Restored Core's package independence by making route context types generic.
- Added type-check and smoke-test gates for the official example.
- Added SQLite integration coverage for database health, commit, rollback, automatic transaction cleanup and shutdown.
- Prevented an explicitly rolled-back UnitOfWork transaction from being rolled back again during context disposal.
- Fixed CLI contexts to expose the real application, release signal listeners and leave application tracking on every exit path.
- Made existing CLI commands resolve project files from `app.basePath` and repaired Tinker's stdin iteration.
- Split CI compatibility gates between Bun `1.4.0` on Windows, Linux and macOS, plus the latest stable Bun on Linux; every gate runs types, build, tests, example and tarball-consumer validation.
- Added alpha-specific package installation and API guides, with compilation checks for their TypeScript snippets.

### Security and release controls

- Removed the non-blocking dependency-audit escape from CI.
- Made dependency auditing compatible with the minimum supported Bun version by using `bun audit`.
- Set prerelease publishing to the `alpha` dist-tag instead of `latest`.
- Removed the example's hard-coded JWT secret and stack traces in error responses.
- Fixed authenticated principal registration so valid JWTs work in isolated request scopes.
- Switched JWT signature verification to Web Crypto verification and covered altered tokens in the HTTP security pipeline.
- Made authenticated security rules return 401 when no principal binding exists.
- Hardened prerelease automation so type checks, coverage, the example, documentation, audit and an isolated consumer all gate publication.
- Made release automation publish the exact tarballs installed and exercised by the consumer validation, restricted to `v0.1.0-alpha.N` and the `alpha` dist-tag.
