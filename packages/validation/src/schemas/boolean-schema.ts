import type { Schema } from "../schema";
import { ValidationException } from "../schema";
export class BooleanSchema implements Schema<boolean> {
  parse(input: unknown): boolean {
    if (typeof input !== "boolean") throw new ValidationException([{ path: "", message: "se esperaba un boolean" }]);
    return input;
  }
  safeParse(input: unknown) {
    try { return { success: true as const, data: this.parse(input) }; }
    catch (e) { return { success: false as const, errors: (e as ValidationException).issues }; }
  }
}
