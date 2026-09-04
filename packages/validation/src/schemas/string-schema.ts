import type { Schema, ValidationIssue } from "../schema";
import { ValidationException } from "../schema";
export class StringSchema implements Schema<string> {
  #refinements: Array<(v: string) => ValidationIssue | undefined> = [];
  uuid(): this {
    this.#refinements.push((v) => (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v) ? { path: "", message: "debe ser un UUID válido" } : undefined));
    return this;
  }
  email(): this {
    this.#refinements.push((v) => (!/^[^@]+@[^@]+\.[^@]+$/.test(v) ? { path: "", message: "debe ser un email válido" } : undefined));
    return this;
  }
  minLength(n: number): this {
    this.#refinements.push((v) => (v.length < n ? { path: "", message: `debe tener al menos ${n} caracteres` } : undefined));
    return this;
  }
  parse(input: unknown): string {
    if (typeof input !== "string") throw new ValidationException([{ path: "", message: "se esperaba un string" }]);
    const issues = this.#refinements.map((r) => r(input)).filter((i): i is ValidationIssue => i !== undefined);
    if (issues.length > 0) throw new ValidationException(issues);
    return input;
  }
  safeParse(input: unknown) {
    try { return { success: true as const, data: this.parse(input) }; }
    catch (e) { return { success: false as const, errors: (e as ValidationException).issues }; }
  }
}
