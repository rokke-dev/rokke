# `@rokke/testing`

Test application contexts, HTTP request contexts and an ephemeral HTTP client for `bun:test`.

> Alpha `0.1.0-alpha.1`: intended for evaluation with Bun `>=1.4.0`.

## Installation

```bash
bun add --dev @rokke/testing @rokke/core @rokke/http
```

## Minimal use

```ts
import { createTestHttpContext } from "@rokke/testing";

const ctx = createTestHttpContext({
  method: "GET",
  path: "/users?active=true",
  params: { id: "42" },
});
const response = ctx.json({ ok: true });
```

## Included surface

`createTestApplicationContext`, test bindings, `createTestHttpContext` and `HttpTestClient`.

Licensed under [MIT](../../LICENSE).
