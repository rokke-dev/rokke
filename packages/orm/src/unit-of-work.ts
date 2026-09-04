import type { SQL } from "bun";
import { currentExecutionContext } from "@rokke/core";
export interface Transaction {
  readonly sql: SQL;
  commit(): Promise<void>;
  rollback(): Promise<void>;
}
export class UnitOfWork {
  readonly rootSql: SQL;
  constructor(rootSql: SQL) {
    this.rootSql = rootSql;
  }
  async begin(): Promise<Transaction> {
    let completed = false;
    let txSql!: SQL & { __resolve?: () => void; __reject?: (e: unknown) => void };
    let resolveReady!: () => void;
    const ready = new Promise<void>((resolve) => { resolveReady = resolve; });
    const txPromise = this.rootSql.begin(async (scopedSql) => {
      txSql = scopedSql as typeof txSql;
      resolveReady();
      await new Promise<void>((resolve, reject) => {
        txSql.__resolve = resolve;
        txSql.__reject = reject;
      });
    });
    await ready;
    const ctx = currentExecutionContext();
    ctx.onDispose(async () => { if (!completed) await this.#internalRollback(txSql, txPromise); });
    return {
      sql: txSql,
      commit: async () => { completed = true; txSql.__resolve!(); await txPromise; },
      rollback: async () => { completed = true; await this.#internalRollback(txSql, txPromise); },
    };
  }
  async #internalRollback(txSql: { __reject?: (e: unknown) => void }, txPromise: Promise<unknown>): Promise<void> {
    txSql.__reject!(new Error("rollback"));
    await txPromise.catch(() => {}); 
  }
}
