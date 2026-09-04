import { expect, test, describe } from "bun:test";
import { quoteIdentifier } from "../src/identifier";
import { compileSelect } from "../src/compile";
import { table } from "../src/query-builder";
import { SQL } from "bun";
import { UnsafeIdentifierError } from "../src/identifier";
describe("query-builder", () => {
  describe("identifier", () => {
    test("quoteIdentifier() lanza UnsafeIdentifierError si hay inyección", () => {
      expect(() => quoteIdentifier("users; DROP TABLE x")).toThrow(UnsafeIdentifierError);
    });
    test("quoteIdentifier() funciona con nombres seguros", () => {
      expect(quoteIdentifier("users")).toBe("\"users\"");
    });
  });
  describe("compile", () => {
    test("dos where() encadenados producen WHERE con parámetros en params", () => {
      const state = {
        table: "users",
        wheres: [
          { connector: "AND" as const, column: "a", op: "=" as const, value: 1 },
          { connector: "AND" as const, column: "b", op: "=" as const, value: 2 },
        ]
      };
      const result = compileSelect(state);
      expect(result.text).toBe("SELECT * FROM \"users\" WHERE \"a\" = $1 AND \"b\" = $2");
      expect(result.params).toEqual([1, 2]);
    });
    test("whereIn con 3 valores produce IN (, , )", () => {
      const state = {
        table: "users",
        wheres: [
          { connector: "AND" as const, column: "role", op: "IN" as const, value: ["A", "B", "C"] },
        ]
      };
      const result = compileSelect(state);
      expect(result.text).toBe("SELECT * FROM \"users\" WHERE \"role\" IN ($1, $2, $3)");
      expect(result.params).toEqual(["A", "B", "C"]);
    });
  });
  describe("SqlQueryBuilder", () => {
    test(".paginate({page: 2, perPage: 10}) devuelve data y total correctos", async () => {
      let countCalled = false;
      let limitCalled = false;
      const sql = {
        unsafe: async (query: string, params: any[]) => {
          if (query.includes("COUNT(*)")) {
            countCalled = true;
            return [{ count: "25" }]; 
          } else {
            limitCalled = true;
            expect(query).toContain("LIMIT 10 OFFSET 10"); 
            return new Array(10).fill({ id: 1 });
          }
        }
      } as unknown as SQL;
      const qb = table(sql, "users");
      const result = await qb.paginate({ page: 2, perPage: 10 });
      expect(countCalled).toBe(true);
      expect(limitCalled).toBe(true);
      expect(result.data.length).toBe(10);
      expect(result.total).toBe(25);
    });
    test(".count() devuelve number, no el string crudo", async () => {
      const sql = {
        unsafe: async (query: string, params: any[]) => {
          return [{ count: "42" }];
        }
      } as unknown as SQL;
      const qb = table(sql, "users");
      const total = await qb.count();
      expect(total).toBe(42);
      expect(typeof total).toBe("number");
    });
  });
});