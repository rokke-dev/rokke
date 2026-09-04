# `@rokke/http`

HTTP routing, request contexts, middleware, error responses and health endpoints built on `Bun.serve`.

> Alpha `0.1.0-alpha.1`: intended for evaluation with Bun `>=1.4.0`, not production.

## Installation

```bash
bun add @rokke/http @rokke/core @rokke/config @rokke/logger
```

## Minimal use

```ts
import { Controller, Get, type HttpRequestContext } from "@rokke/http";

@Controller("/hello")
class HelloController {
  @Get("")
  index(ctx: HttpRequestContext): Response {
    return ctx.json({ hello: "world" });
  }
}
```

Controllers are discovered from `src/**/*.controller.ts` by default when `HttpProvider` boots.

## Included surface

`HttpProvider`, `Router`, `RouteTable`, controller/route decorators, middleware composition, `HttpRequestContext`, body parsing, safe responses, exception handlers and `/health`/`/ready`.

Licensed under [MIT](../../LICENSE).
