# `@rokke/events`

In-process fire-and-forget events with explicit or discovered listeners.

> Alpha `0.1.0-alpha.1`: intended for evaluation with Bun `>=1.4.0`, not production.

## Installation

```bash
bun add @rokke/events @rokke/core @rokke/logger
```

## Minimal use

```ts
import { InMemoryContainer } from "@rokke/core";
import { Event, EventBus } from "@rokke/events";

class UserRegistered extends Event {}
const bus = new EventBus(new InMemoryContainer());
bus.register(UserRegistered, { async handle() {} });
bus.emit(new UserRegistered());
```

## Included surface

`Event`, `EventListener`, `Listener`, `EventBus` and listener discovery.

Licensed under [MIT](../../LICENSE).
