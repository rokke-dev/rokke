<div align="center">
  <img src="assets/rokke.svg" alt="Rokke Framework Logo" width="200" />
  <h1>Rokke Framework</h1>
  <p><strong>Strict, SOLID backend framework built natively for Bun.</strong></p>
  
  [![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](./LICENSE)
  [![Bun](https://img.shields.io/badge/Bun-v1.4+-black.svg?logo=bun)](https://bun.sh)
  [![TypeScript](https://img.shields.io/badge/TypeScript-7.0+-3178C6.svg?logo=typescript)](https://www.typescriptlang.org)
</div>

> **Alpha status:** `0.1.0-alpha.1` is intended for developer evaluation. It is not production-ready and its public API may change between alpha releases.

---

**Rokke** is a modern backend framework designed specifically for [Bun](https://bun.sh). It achieves maximum performance by heavily leveraging Bun's native C++ implementations (`Bun.serve`, `bun:sql`, `Bun.password`, etc.) without introducing **any** third-party runtime dependencies.

Instead of magic, Rokke prioritizes **explicit architecture**. It implements strict SOLID principles, a topological Inversion of Control (IoC) container, and an isolated request lifecycle using `AsyncLocalStorage`.

## ⚡ Core Principles

1. **Zero Third-Party Runtime Dependencies**: Rokke uses only Bun native APIs and standard Web APIs.
2. **True Object-Oriented Architecture**: Service Providers, IoC Container, Facades, Builders, Chain of Responsibility, and Observers.
3. **Explicit Contracts**: Public types, tokens and provider lifecycles make dependencies and cleanup visible and testable.
4. **Restrained Magic**: Uses Stage-3 TypeScript decorators strictly for business routing (`@Get`, `@Post`), IoC discovery (`@Injectable`), and Authorization (`@RequiresAuthority`). No proxy magic; explicitly initialized classes.
5. **Memory Isolated Execution**: Guaranteed request isolation via `AsyncLocalStorage` (`ExecutionContext`), ensuring context (HTTP, DB transactions, User auth) never leaks across concurrent requests.

## 📦 Monorepo Packages

Rokke is highly modular. You only load what you need.

| Package | Description |
|---|---|
| [`@rokke/core`](./packages/core) | Application kernel, IoC Container, Service Providers, lifecycle |
| [`@rokke/fs`](./packages/fs) | FileSystem, Glob utilities and local storage |
| [`@rokke/logger`](./packages/logger) | High-performance structured logger with pluggable transports |
| [`@rokke/config`](./packages/config) | Typed declarative schema configuration & environment validation |
| [`@rokke/http`](./packages/http) | High-performance HTTP server, routing, context & middleware |
| [`@rokke/view`](./packages/view) | Basic template rendering, escaping and compiled-template cache |
| [`@rokke/query-builder`](./packages/query-builder) | Fluent, strictly typed SQL query builder for `bun:sql` |
| [`@rokke/orm`](./packages/orm) | Entity metadata, Repository, Unit of Work and migration contracts |
| [`@rokke/security`](./packages/security) | Auth guards, policies, hashing, JWT, CSRF, rate limiting and secure headers |
| [`@rokke/validation`](./packages/validation) | Runtime type validation and schema constraints |
| [`@rokke/events`](./packages/events) | Decoupled event bus and auto-discovered listener system |
| [`@rokke/cache`](./packages/cache) | Cache abstraction with an in-memory implementation |
| [`@rokke/testing`](./packages/testing) | Testing utilities, mocks, and HTTP test client for `bun:test` |
| [`@rokke/devtools`](./packages/devtools) | Request-profile buffer and production-environment guard |
| [`@rokke/cli`](./packages/cli) | Command dispatcher and the command classes currently listed in the API inventory |

## 🚀 Getting Started

```bash
# Clone the repository
git clone https://github.com/rokke-dev/rokke.git
cd rokke

# Install workspace dependencies (requires Bun 1.4+)
bun install

# Build all TypeScript declarations
bun run build

# Run the test suite (100+ native tests)
bun test
```

## 🛡️ Community & Policies

* [Security Policy](./SECURITY.md)
* [Contributing Guidelines](./CONTRIBUTING.md)
* [Code of Conduct](./CODE_OF_CONDUCT.md)
* [License (MIT)](./LICENSE)

---
<div align="center">
  Copyright © 2026 Fernando Duarte &lt;ferchd@rokke.dev&gt;
</div>
