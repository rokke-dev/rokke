# `@rokke/orm`

Entity metadata, repository/query access, database provider and Unit of Work for Bun SQL.

> Alpha `0.1.0-alpha.1`: intended for evaluation with Bun `>=1.4.0`, not production.

## Installation

```bash
bun add @rokke/orm @rokke/query-builder @rokke/core @rokke/config
```

## Minimal use

```ts
import { Column, Entity, Model, PrimaryKey } from "@rokke/orm";

@Entity("users")
class User extends Model<User> {
  @PrimaryKey() id!: number;
  @Column() name!: string;
}

const query = User.query().where("name", "=", "Ada");
```

## Included surface

Entity decorators, `Model`, `Repository`, expressions, `DatabaseProvider`, SQL/Unit-of-Work tokens, transactions and migration contracts/lock.

Licensed under [MIT](../../LICENSE).
