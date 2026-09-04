# `@rokke/cli`

Command signatures, dispatcher, command lifecycle and the currently exported command classes.

> Alpha `0.1.0-alpha.1`: library evaluation only with Bun `>=1.4.0`; no executable is published.

## Installation

```bash
bun add @rokke/cli
```

## Minimal use

```ts
import { parseSignature } from "@rokke/cli";

const signature = parseSignature("example <name> [mode]");
```

## Included surface

`Command`, `CliCommandContext`, `dispatch`, signature/errors, `DoctorCommand`, `DevCommand`, `TinkerCommand`, `MigrateCommand` and `OptimizeRoutesCommand`.

Licensed under [MIT](../../LICENSE).
