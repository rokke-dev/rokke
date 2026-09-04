# `@rokke/devtools`

Bounded in-memory request profiles and a provider that refuses to load in production.

> Alpha `0.1.0-alpha.1`: development use only with Bun `>=1.4.0`.

## Installation

```bash
bun add --dev @rokke/devtools @rokke/core @rokke/config
```

## Minimal use

```ts
import type { RequestProfile } from "@rokke/devtools";

const profile: RequestProfile = {
  correlationId: "request-1",
  route: { pattern: "/users", controller: "UsersController", method: "index" },
  timings: { middleware: [], total: 4.2 },
  queries: [],
};
```

## Included surface

`RequestProfile`, `DevtoolsProvider` and `DevtoolsMustNotRunInProductionError`.

Licensed under [MIT](../../LICENSE).
