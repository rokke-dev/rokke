import { expect, test, describe } from "bun:test";
import { runInExecutionContext, currentExecutionContext, NoActiveExecutionContextError } from "../src/execution-context-storage";
import { ExecutionContext } from "../src";
class DummyContext extends ExecutionContext {
  kind = "http" as const;
  container: any;
  signal = new AbortController().signal;
  correlationId: string;
  constructor(id: string) { super(); this.correlationId = id; }
  toTraceParent() { return "dummy"; }
  onDispose = () => {};
  async [Symbol.asyncDispose]() {}
}
describe("ExecutionContextStorage", () => {
  test("currentExecutionContext() outside runInExecutionContext() throws NoActiveExecutionContextError", () => {
    expect(() => currentExecutionContext()).toThrow(NoActiveExecutionContextError);
  });
  test("inside runInExecutionContext(ctx, fn), currentExecutionContext() returns exactly ctx", () => {
    const ctx = new DummyContext("1");
    runInExecutionContext(ctx, () => {
      expect(currentExecutionContext()).toBe(ctx);
    });
  });
  test("concurrent calls to runInExecutionContext are isolated", async () => {
    const ctx1 = new DummyContext("1");
    const ctx2 = new DummyContext("2");
    const p1 = runInExecutionContext(ctx1, async () => {
      expect(currentExecutionContext().correlationId).toBe("1");
      await new Promise((r) => setTimeout(r, 10));
      expect(currentExecutionContext().correlationId).toBe("1");
    });
    const p2 = runInExecutionContext(ctx2, async () => {
      expect(currentExecutionContext().correlationId).toBe("2");
      await new Promise((r) => setTimeout(r, 10));
      expect(currentExecutionContext().correlationId).toBe("2");
    });
    await Promise.all([p1, p2]);
  });
});
