# `@rokke/cache`

Minimal cache contract with an in-memory TTL implementation.

> Alpha `0.1.0-alpha.1`: intended for evaluation with Bun `>=1.4.0`, not production.

## Installation

```bash
bun add @rokke/cache
```

## Minimal use

```ts
import { InMemoryCache, remember } from "@rokke/cache";

const cache = new InMemoryCache();
const value = await remember(cache, "answer", 1_000, async () => 42);
```

## Included surface

`Cache`, `InMemoryCache` and `remember`.

Licensed under [MIT](../../LICENSE).
