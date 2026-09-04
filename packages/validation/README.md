# `@rokke/validation`

Small runtime schemas for strings, numbers, booleans, objects, optional values and uploaded files.

> Alpha `0.1.0-alpha.1`: intended for evaluation with Bun `>=1.4.0`, not production.

## Installation

```bash
bun add @rokke/validation
```

## Minimal use

```ts
import { Schema } from "@rokke/validation";

const input = Schema.object({
  email: Schema.string().email(),
  age: Schema.number().positive(),
  active: Schema.optional(Schema.boolean()),
});
const result = input.safeParse({ email: "ada@example.test", age: 36 });
```

## Included surface

The current schemas, `safeParse`, validation issues/exceptions and `UploadedFile`.

Licensed under [MIT](../../LICENSE).
