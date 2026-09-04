# `@rokke/security`

Password hashing, HMAC JWT, CSRF, request guards, policies, rate limiting and defensive headers.

> Alpha `0.1.0-alpha.1`: intended for evaluation with Bun `>=1.4.0`, not production or a security certification.

## Installation

```bash
bun add @rokke/security @rokke/core @rokke/http
```

## Minimal use

```ts
import { AuthGuard, Jwt, guardMiddleware, secureHeadersMiddleware } from "@rokke/security";

const jwt = new Jwt({ secret: "load-this-from-a-secret-store" });
const auth = guardMiddleware(new AuthGuard(jwt));
const headers = secureHeadersMiddleware();
```

## Included surface

`Hash`, `Jwt`, `Csrf`, principals/security context, guards, policies/`Gate`, authorities, in-memory rate limiting, secure headers and security rules.

See [SECURITY.md](../../SECURITY.md). Licensed under [MIT](../../LICENSE).
