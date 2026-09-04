import type { Schema, ValidationIssue } from "../schema";
import { ValidationException } from "../schema";
export class NumberSchema implements Schema<number> {
  #refinements: Array<(v: number) => ValidationIssue | undefined> = [];
  positive(): this {
    this.#refinements.push((v) => (v <= 0 ? { path: "", message: "debe ser un número positivo" } : undefined));
    return this;
  }
  min(n: number): this {
    this.#refinements.push((v) => (v < n ? { path: "", message: `debe ser mayor o igual a ${n}` } : undefined));
    return this;
  }
  parse(input: unknown): number {
    if (typeof input !== "number" || Number.isNaN(input)) throw new ValidationException([{ path: "", message: "se esperaba un número" }]);
    const issues = this.#refinements.map((r) => r(input)).filter((i): i is ValidationIssue => i !== undefined);
    if (issues.length > 0) throw new ValidationException(issues);
    return input;
  }
  safeParse(input: unknown) {
    try { return { success: true as const, data: this.parse(input) }; }
    catch (e) { return { success: false as const, errors: (e as ValidationException).issues }; }
  }
}
