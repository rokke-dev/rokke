import { quoteIdentifier } from "./identifier";
import type { QueryState } from "./types";
export interface CompiledQuery {
  readonly text: string;
  readonly params: readonly unknown[];
}
export function compileSelect(state: QueryState): CompiledQuery {
  const params: unknown[] = [];
  const columns = state.selectColumns?.map(quoteIdentifier).join(", ") ?? "*";
  let text = `SELECT ${columns} FROM ${quoteIdentifier(state.table)}`;
  if (state.wheres.length > 0) {
    text += ` WHERE ${state.wheres.map((w, i) => {
      const prefix = i === 0 ? "" : ` ${w.connector} `;
      if (w.op === "BETWEEN") {
        const [from, to] = w.value as [unknown, unknown];
        params.push(from, to);
        return `${prefix}${quoteIdentifier(w.column)} BETWEEN $${params.length - 1} AND $${params.length}`;
      }
      if (w.op === "IN") {
        const values = w.value as unknown[];
        const placeholders = values.map((v) => { params.push(v); return `$${params.length}`; });
        return `${prefix}${quoteIdentifier(w.column)} IN (${placeholders.join(", ")})`;
      }
      params.push(w.value);
      return `${prefix}${quoteIdentifier(w.column)} ${w.op} $${params.length}`;
    }).join("")}`;
  }
  if (state.orderByClause) {
    text += ` ORDER BY ${quoteIdentifier(state.orderByClause.column)} ${state.orderByClause.direction.toUpperCase()}`;
  }
  if (state.limitValue !== undefined) text += ` LIMIT ${state.limitValue}`;
  if (state.offsetValue !== undefined) text += ` OFFSET ${state.offsetValue}`;
  return { text, params };
}
