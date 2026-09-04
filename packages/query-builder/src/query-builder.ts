import type { SQL } from "bun";
import { compileSelect } from "./compile";
import type { ComparisonOp, QueryState } from "./types";
export interface PaginatedResult<T> {
  readonly data: readonly T[];
  readonly total: number;
  readonly page: number;
}
export class SqlQueryBuilder<T> {
  readonly sql: SQL;
  readonly state: QueryState;
  constructor(sql: SQL, state: QueryState) {
    this.sql = sql;
    this.state = state;
  }
  where<K extends keyof T & string>(column: K, op: ComparisonOp, value: T[K]): SqlQueryBuilder<T> {
    return this.#clone({ wheres: [...this.state.wheres, { connector: "AND", column, op, value }] });
  }
  andWhere<K extends keyof T & string>(column: K, op: ComparisonOp, value: T[K]): SqlQueryBuilder<T> {
    return this.where(column, op, value);
  }
  orWhere<K extends keyof T & string>(column: K, op: ComparisonOp, value: T[K]): SqlQueryBuilder<T> {
    return this.#clone({ wheres: [...this.state.wheres, { connector: "OR", column, op, value }] });
  }
  whereBetween<K extends keyof T & string>(column: K, range: readonly [T[K], T[K]]): SqlQueryBuilder<T> {
    return this.#clone({ wheres: [...this.state.wheres, { connector: "AND", column, op: "BETWEEN", value: range }] });
  }
  whereIn<K extends keyof T & string>(column: K, values: readonly T[K][]): SqlQueryBuilder<T> {
    return this.#clone({ wheres: [...this.state.wheres, { connector: "AND", column, op: "IN", value: values }] });
  }
  orderBy<K extends keyof T & string>(column: K, direction: "asc" | "desc"): SqlQueryBuilder<T> {
    return this.#clone({ orderByClause: { column, direction } });
  }
  limit(n: number): SqlQueryBuilder<T> { return this.#clone({ limitValue: n }); }
  offset(n: number): SqlQueryBuilder<T> { return this.#clone({ offsetValue: n }); }
  async toList(): Promise<T[]> {
    const { text, params } = compileSelect(this.state);
    return (await this.sql.unsafe(text, params)) as T[];
  }
  async first(): Promise<T | null> {
    const results = await this.limit(1).toList();
    return results[0] ?? null;
  }
  async count(): Promise<number> {
    const { text, params } = compileSelect({ ...this.state, selectColumns: undefined });
    const countText = text.replace(/^SELECT \*/, "SELECT COUNT(*) as count");
    const rows = (await this.sql.unsafe(countText, params)) as Array<{ count: string }>;
    return Number(rows[0]?.count ?? 0); 
  }
  async paginate(opts: { page: number; perPage: number }): Promise<PaginatedResult<T>> {
    const total = await this.count();
    const data = await this.limit(opts.perPage).offset((opts.page - 1) * opts.perPage).toList();
    return { data, total, page: opts.page };
  }
  #clone(patch: Partial<QueryState>): SqlQueryBuilder<T> {
    return new SqlQueryBuilder(this.sql, { ...this.state, ...patch });
  }
}
export function table<T>(sql: SQL, name: string): SqlQueryBuilder<T> {
  return new SqlQueryBuilder<T>(sql, { table: name, wheres: [] });
}
