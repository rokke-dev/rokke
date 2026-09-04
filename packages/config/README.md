# `@rokke/config`

Application configuration loading, environment parsing and mounted-secret lookup.

> Alpha `0.1.0-alpha.1`: intended for evaluation with Bun `>=1.4.0`, not production.

## Installation

```bash
bun add @rokke/config
```

## Minimal use

```ts
import { defineConfig } from "@rokke/config";

export default defineConfig({
  app: { name: "Example", env: "development", debug: false },
  http: { port: 3000 },
});
```

Place configuration modules under `config/*.ts`. `APP_ENV` and `APP_DEBUG` override file values.

## Included surface

`ConfigProvider`, `ConfigToken`, `defineConfig`, `Env`, `Secrets` and their current errors and types.

Licensed under [MIT](../../LICENSE).
