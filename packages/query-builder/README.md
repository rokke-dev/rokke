# `@rokke/query-builder`

Parameterized `SELECT` query construction for Bun's `SQL` API.

> Alpha `0.1.0-alpha.1`: intended for evaluation with Bun `>=1.4.0`, not production.

## Installation

```bash
bun add @rokke/query-builder
```

## Minimal use

```ts
import { SQL } from "bun";
import { table } from "@rokke/query-builder";

interface User { id: number; active: boolean }
const users = table<User>(new SQL("sqlite://:memory:"), "users");
const activeUsers = users.where("active", "=", true).orderBy("id", "asc");
```

## Included surface

`SqlQueryBuilder`, `table`, `compileSelect`, identifier validation, filtering, ordering, pagination and count.

Licensed under [MIT](../../LICENSE).
