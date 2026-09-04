export type ComparisonOp = "=" | "!=" | ">" | ">=" | "<" | "<=";
interface WhereClause {
  readonly connector: "AND" | "OR";
  readonly column: string;
  readonly op: ComparisonOp | "LIKE" | "BETWEEN" | "IN";
  readonly value: unknown;
}
export interface QueryState {
  readonly table: string;
  readonly wheres: readonly WhereClause[];
  readonly orderByClause?: { readonly column: string; readonly direction: "asc" | "desc" };
  readonly selectColumns?: readonly string[];
  readonly limitValue?: number;
  readonly offsetValue?: number;
}
