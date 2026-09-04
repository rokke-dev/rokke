import { AsyncLocalStorage } from "node:async_hooks";
import type { ExecutionContext } from "./contracts";
const storage = new AsyncLocalStorage<ExecutionContext>();
export function runInExecutionContext<T>(context: ExecutionContext, fn: () => T): T {
  return storage.run(context, fn);
}
export function currentExecutionContext(): ExecutionContext {
  const ctx = storage.getStore();
  if (!ctx) throw new NoActiveExecutionContextError();
  return ctx;
}
export class NoActiveExecutionContextError extends Error {
  constructor() {
    super("currentExecutionContext() called outside runInExecutionContext() — no active context.");
    this.name = "NoActiveExecutionContextError";
  }
}
