# `@rokke/logger`

Structured logging with console, JSON and file transports plus execution-context correlation IDs.

> Alpha `0.1.0-alpha.1`: intended for evaluation with Bun `>=1.4.0`, not production.

## Installation

```bash
bun add @rokke/logger
```

## Minimal use

```ts
import { ConsoleTransport, FrameworkLogger } from "@rokke/logger";

const logger = new FrameworkLogger([new ConsoleTransport()], "api", "info");
logger.info("server ready", { port: 3000 });
```

## Included surface

Logger contracts, `FrameworkLogger`, `LoggerProvider`, `LoggerToken`, log levels and the console, JSON and file transports.

Licensed under [MIT](../../LICENSE).
