import { table, type SqlQueryBuilder } from "@rokke/query-builder";
import { readEntityMetadata } from "./decorators";
import { MissingEntityMetadataError } from "./model";
import type { SQL } from "bun";
export interface EntityClass<T> { new (): T }
export abstract class Repository<T> {
  protected readonly sql: SQL;
  protected readonly entity: EntityClass<T>;
  protected constructor(sql: SQL, entity: EntityClass<T>) {
    this.sql = sql;
    this.entity = entity;
  }
  protected query(): SqlQueryBuilder<T> {
    const meta = readEntityMetadata(this.entity as unknown as Function);
    if (!meta) throw new MissingEntityMetadataError(this.entity.name);
    return table<T>(this.sql, meta.tableName!);
  }
}
