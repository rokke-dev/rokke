import type { ComparisonOp } from "@rokke/query-builder";
export interface Condition {
  readonly __brand: "Condition";
  readonly column: string;
  readonly op: ComparisonOp;
  readonly value: unknown;
}
type FieldExpr<V> = { equals(value: V): Condition; greaterThan(value: V): Condition; lessThan(value: V): Condition };
export type EntityProxy<T> = { [K in keyof T]: FieldExpr<T[K]> };
export function createEntityProxy<T>(): EntityProxy<T> {
  return new Proxy({}, {
    get(_target, prop: string): FieldExpr<unknown> {
      return {
        equals: (value) => ({ __brand: "Condition", column: prop, op: "=", value }) as Condition,
        greaterThan: (value) => ({ __brand: "Condition", column: prop, op: ">", value }) as Condition,
        lessThan: (value) => ({ __brand: "Condition", column: prop, op: "<", value }) as Condition,
      };
    },
  }) as EntityProxy<T>;
}
export class InvalidPredicateError extends Error {
  constructor() {
    super("El predicado no devolvió una Condition válida — ¿usaste && o || en vez de .and()/.or()?");
    this.name = "InvalidPredicateError";
  }
}
export function assertIsCondition(value: unknown): asserts value is Condition {
  if (typeof value !== "object" || value === null || (value as Condition).__brand !== "Condition") {
    throw new InvalidPredicateError();
  }
}
