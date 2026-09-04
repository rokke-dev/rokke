# `@rokke/fs`

Thin Bun-native filesystem helpers, deterministic glob scanning and local storage.

> Alpha `0.1.0-alpha.1`: intended for evaluation with Bun `>=1.4.0`, not production.

## Installation

```bash
bun add @rokke/fs
```

## Minimal use

```ts
import { LocalStorage } from "@rokke/fs";

const storage = new LocalStorage("./storage");
await storage.write("notes/example.txt", "hello");
const text = await storage.read("notes/example.txt").text();
```

## Included surface

`FileSystem`, `FileReference`, `Glob`, `Storage` and `LocalStorage`.

Licensed under [MIT](../../LICENSE).
