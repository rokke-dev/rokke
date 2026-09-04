import { expect, test, describe } from "bun:test";
import { createEntityProxy, assertIsCondition, InvalidPredicateError } from "../src/expressions";
describe("orm", () => {
  describe("proxy", () => {
    test("where(u => u.age.greaterThan(18)) produce Condition", () => {
      const proxy = createEntityProxy<{ age: number }>();
      const condition = proxy.age.greaterThan(18);
      expect(condition.column).toBe("age");
      expect(condition.op).toBe(">");
      expect(condition.value).toBe(18);
    });
    test("&& lanza InvalidPredicateError", () => {
      expect(() => {
        const p = createEntityProxy<{ a: number, b: number }>();
        const res = (p.a as any === 1) && (p.b as any === 2);
        assertIsCondition(res);
      }).toThrow(InvalidPredicateError);
    });
  });
});