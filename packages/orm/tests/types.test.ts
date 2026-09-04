import { expect, test, describe } from "bun:test";
import type { ColumnTsType } from "../src/decorators";
describe("Type tests", () => {
  test("decimal column types as string", () => {
    const _check: ColumnTsType<"decimal"> = "12.34";
    // @ts-expect-error
    const _checkFail: ColumnTsType<"decimal"> = 12.34;
    expect(true).toBe(true);
  });
});
