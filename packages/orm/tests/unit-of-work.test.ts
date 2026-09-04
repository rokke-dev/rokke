import { expect, test, describe, mock } from "bun:test";
import { UnitOfWork } from "../src/unit-of-work";
import { SQL } from "bun";
import { ExecutionContext, runInExecutionContext } from "@rokke/core";
class DummyContext extends ExecutionContext {
  kind = "http" as const;
  container: any;
  signal = new AbortController().signal;
  correlationId = "corr-123";
  toTraceParent() { return "dummy"; }
  #disposeCallbacks: Array<() => Promise<void>> = [];
  onDispose = (cleanup: () => Promise<void>): void => {
    this.#disposeCallbacks.push(cleanup);
  };
  async [Symbol.asyncDispose](): Promise<void> {
    for (const cleanup of [...this.#disposeCallbacks].reverse()) {
      try { await cleanup(); } catch {}
    }
  }
}
describe("UnitOfWork", () => {
  test("begin() + commit()", async () => {
    let committed = false;
    const mockRootSql = {
      begin: async (callback: any) => {
        const scopedSql = {};
        await callback(scopedSql);
        committed = true; 
      }
    } as unknown as SQL;
    const uow = new UnitOfWork(mockRootSql);
    const ctx = new DummyContext();
    await runInExecutionContext(ctx, async () => {
      const tx = await uow.begin();
      await tx.commit();
    });
    expect(committed).toBe(true);
  });
  test("begin() sin commit() hace rollback al disponer", async () => {
    let rollbacked = false;
    const mockRootSql = {
      begin: async (callback: any) => {
        const scopedSql = {};
        try {
          await callback(scopedSql);
        } catch (e) {
          if ((e as Error).message === "rollback") {
            rollbacked = true;
          }
        }
      }
    } as unknown as SQL;
    const uow = new UnitOfWork(mockRootSql);
    const ctx = new DummyContext();
    await runInExecutionContext(ctx, async () => {
      await uow.begin(); 
    });
    await ctx[Symbol.asyncDispose]();
    expect(rollbacked).toBe(true);
  });
  test("excepción entre begin() y commit() causa rollback", async () => {
    let rollbacked = false;
    const mockRootSql = {
      begin: async (callback: any) => {
        const scopedSql = {};
        try {
          await callback(scopedSql);
        } catch (e) {
          if ((e as Error).message === "rollback") {
            rollbacked = true;
          }
        }
      }
    } as unknown as SQL;
    const uow = new UnitOfWork(mockRootSql);
    const ctx = new DummyContext();
    try {
      await runInExecutionContext(ctx, async () => {
        await uow.begin();
        throw new Error("Algo salió mal");
      });
    } catch {}
    await ctx[Symbol.asyncDispose]();
    expect(rollbacked).toBe(true);
  });
});
