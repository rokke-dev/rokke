# Contributing to Rokke

Thank you for contributing to Rokke. Start with a bounded issue that defines observable acceptance criteria and explicit non-goals; unscoped feature work is not accepted.

---

## 1. Development Setup

### Prerequisites

* **Bun** `>= 1.4.0` ([Installation instructions](https://bun.sh/docs/installation))
* **Git** `>= 2.40.0`

### Getting Started

1. Clone the repository and submodules:
   ```bash
   git clone https://github.com/rokke-dev/rokke.git
   cd rokke
   ```

2. Install dependencies across all packages in the workspace:
   ```bash
   bun install
   ```

3. Run the fast local gate:
   ```bash
   bun run verify:fast
   ```

4. Before opening a pull request, run the complete gate:
   ```bash
   bun run verify
   ```

---

## 2. Monorepo Architecture & Rules

Each package inside `packages/*` is an independent package published to npm as `@rokke/<name>`.

### Design Guidelines

* **Zero third-party runtime dependencies in the core:** Core packages rely on Bun and Web APIs. Official integration packages may depend on the SDK they adapt when that dependency is explicit and justified.
* **Public implementation only:** Keep internal planning, threat analysis, unpublished comparisons and working metadata outside the repository checkout.
* **Contracts over concrete classes:** Expose interfaces and tokens. The IoC container resolves contracts, not concrete implementations.
* **Strict TypeScript 7 rules:**
  * No `any` — use strict types, generics, or `unknown`.
  * Enable all compiler checks (`noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, `erasableSyntaxOnly`).
  * Use Stage-3 native decorators (maximum 1–2 decorators per class at intent level).
* **Deterministic Execution Contexts:** Ensure resources are cleaned up deterministically with `[Symbol.asyncDispose]` and `using`.

---

## 3. Scripts Reference

| Script | Command | Purpose |
|---|---|---|
| `build` | `bun run build` | Compiles `.d.ts` declaration maps across all packages via `tsc -b` |
| `check` | `bun run check` | Type-checks all packages without running tests |
| `test` | `bun test` | Runs all unit and integration tests with coverage reporting |
| `test:watch` | `bun test --watch` | Runs test runner in watch mode |
| `verify:fast` | `bun run verify:fast` | Runs type checks and the test suite during development |
| `verify` | `bun run verify` | Runs every local release gate, including the example and package consumer |
| `clean` | `bun run clean` | Cleans build artifacts, `.tsbuildinfo`, `dist`, and cache |

---

## 4. Pull Request Guidelines

1. **Start from a ready issue:** The issue must have acceptance criteria, non-goals, priority, area and milestone.
2. **Create a branch:** Use descriptive branch names like `feat/orm-write-queries` or `fix/http-header-validation`.
3. **Conventional Commits:** Follow the conventional commit format:
   - `feat(core): add container scoped resolution`
   - `fix(http): enforce strict rfc9112 header injection validation`
   - `docs(view): document HTMLRewriter visitor lifecycle`
4. **Commit completed increments:** Do not carry completed, verified work uncommitted across sessions.
5. **Tests:** Every bug fix or new feature must include success, failure and relevant integration cases.
6. **Coverage:** Ensure tests meet the minimum 80% line and function thresholds.
7. **Full gate:** Verify `bun run verify` exits with 0 before requesting review.
8. **Pull request:** Link the issue and complete the repository pull-request template.

---

## 5. Community & Code of Conduct

Please note that this project is governed by our [Code of Conduct](./CODE_OF_CONDUCT.md). By participating, you are expected to uphold this code.
