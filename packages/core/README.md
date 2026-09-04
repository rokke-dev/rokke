# `@rokke/core`

Application kernel, dependency container, provider lifecycle and execution-context primitives for Rokke.

> Alpha `0.1.0-alpha.1`: intended for evaluation with Bun `>=1.4.0`, not production. APIs may change between alpha releases.

## Installation

```bash
bun add @rokke/core
```

## Minimal use

```ts
import { Application, ServiceProvider } from "@rokke/core";

class AppProvider extends ServiceProvider {}

const app = await Application.boot(import.meta.dir)
  .withProviders(AppProvider)
  .create();
await app.start();
await app.shutdown();
```

## Included surface

`Application`, `ApplicationBuilder`, `Kernel`, `ServiceProvider`, `InMemoryContainer`, tokens, discovery, `Injectable`, execution contexts and lifecycle errors.

Licensed under [MIT](../../LICENSE).
