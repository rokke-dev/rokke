import type { Schema } from "../schema";
import { ValidationException } from "../schema";
export class OptionalSchema<T> implements Schema<T | undefined> {
  private readonly inner: Schema<T>;
  constructor(inner: Schema<T>) {
    this.inner = inner;
  }
  parse(input: unknown): T | undefined {
    if (input === undefined) return undefined;
    return this.inner.parse(input);
  }
  safeParse(input: unknown) {
    try { return { success: true as const, data: this.parse(input) }; }
    catch (e) { return { success: false as const, errors: (e as ValidationException).issues }; }
  }
}
