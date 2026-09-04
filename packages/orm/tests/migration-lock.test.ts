import { expect, test, describe } from "bun:test";
import { MigrationLock } from "../src/migration-lock";
import { SQL } from "bun";
describe("MigrationLock", () => {
  test("acquire() y release() ejecutan SQL correcto", async () => {
    let queries: string[] = [];
    const sql = {
      unsafe: async (query: string, params: any[]) => {
        queries.push(`${query} [${params.join(",")}]`);
      }
    } as unknown as SQL;
    const lock = new MigrationLock(sql);
    await lock.acquire();
    await lock.release();
    expect(queries).toEqual([
      `SELECT pg_advisory_lock($1) [${MigrationLock.LOCK_KEY}]`,
      `SELECT pg_advisory_unlock($1) [${MigrationLock.LOCK_KEY}]`
    ]);
  });
});
