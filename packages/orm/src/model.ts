import { table, type SqlQueryBuilder } from "@rokke/query-builder";
import { readEntityMetadata } from "./decorators";
import type { SQL } from "bun";
export abstract class Model<T> {
  static sqlConnection: SQL; 
  static query<T>(this: { new (): T } & typeof Model): SqlQueryBuilder<T> {
    const meta = readEntityMetadata(this);
    if (!meta) throw new MissingEntityMetadataError(this.name);
    return table<T>(Model.sqlConnection, meta.tableName!);
  }
}
export class MissingEntityMetadataError extends Error {
  readonly className: string;
  constructor(className: string) {
    super(`"${className}" no está decorada con @Entity — no se puede consultar.`);
    this.name = "MissingEntityMetadataError";
    this.className = className;
  }
}
