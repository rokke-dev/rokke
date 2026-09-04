# `@rokke/view`

Basic HTML interpolation, escaping and compiled-template caching integrated with HTTP contexts.

> Alpha `0.1.0-alpha.1`: intended for evaluation with Bun `>=1.4.0`, not production.

## Installation

```bash
bun add @rokke/view @rokke/http
```

## Minimal use

```ts
import { compileTemplate, renderCompiled } from "@rokke/view";

const compiled = compileTemplate("<h1>{{ user.name }}</h1>");
const response = renderCompiled(compiled, { user: { name: "Ada" } });
```

## Included surface

Template compilation entrypoint, escaped interpolation rendering, compiled cache, HTTP-context integration and debug/mid-stream error helpers.

Licensed under [MIT](../../LICENSE).
