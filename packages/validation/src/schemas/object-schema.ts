import type { Schema, ValidationIssue } from "../schema";
import { ValidationException } from "../schema";
export class ObjectSchema<T extends Record<string, unknown>> implements Schema<T> {
  private readonly shape: { [K in keyof T]: Schema<T[K]> };
  constructor(shape: { [K in keyof T]: Schema<T[K]> }) {
    this.shape = shape;
  }
  parse(input: unknown): T {
    if (typeof input !== "object" || input === null) {
      throw new ValidationException([{ path: "", message: "se esperaba un objeto" }]);
    }
    const result: Record<string, unknown> = {};
    const issues: ValidationIssue[] = [];
    for (const key of Object.keys(this.shape)) {
      try {
        result[key] = this.shape[key as keyof T].parse((input as Record<string, unknown>)[key]);
      } catch (e) {
        if (e instanceof ValidationException) {
          issues.push(...e.issues.map((i) => ({ path: i.path ? `${key}.${i.path}` : key, message: i.message })));
        } else throw e;
      }
    }
    if (issues.length > 0) throw new ValidationException(issues);
    return result as T;
  }
  safeParse(input: unknown) {
    try { return { success: true as const, data: this.parse(input) }; }
    catch (e) { return { success: false as const, errors: (e as ValidationException).issues }; }
  }
}
