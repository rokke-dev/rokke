import { expect, test, describe } from "bun:test";
import { InMemoryContainer } from "../src/container/in-memory-container";
import { token, UnboundTokenError, DuplicateBindingError, CircularDependencyError, ExecutionContext } from "../src";
import { RootOnlyOperationError } from "../src/container/errors";
class DummyContext extends ExecutionContext {
  kind = "http" as const;
  container: InMemoryContainer;
  signal = new AbortController().signal;
  correlationId = "123";
  constructor(c: InMemoryContainer) { super(); this.container = c; }
  toTraceParent() { return "dummy"; }
  onDispose = () => {};
  async [Symbol.asyncDispose]() {}
}
describe("InMemoryContainer", () => {
  test("singleton lifecycle (default) returns same instance", () => {
    const t = token<{ id: number }>("test");
    const container = new InMemoryContainer();
    let counter = 0;
    container.bind(t, () => ({ id: ++counter }));
    const i1 = container.get(t);
    const i2 = container.get(t);
    expect(i1.id).toBe(1);
    expect(i2.id).toBe(1);
    expect(i1).toBe(i2);
  });
  test("transient lifecycle returns new instance", () => {
    const t = token<{ id: number }>("test");
    const container = new InMemoryContainer();
    let counter = 0;
    container.bind(t, () => ({ id: ++counter }), "transient");
    const i1 = container.get(t);
    const i2 = container.get(t);
    expect(i1.id).toBe(1);
    expect(i2.id).toBe(2);
    expect(i1).not.toBe(i2);
  });
  test("scoped lifecycle memoizes per child container", () => {
    const t = token<{ id: number }>("test");
    const root = new InMemoryContainer();
    let counter = 0;
    root.bind(t, () => ({ id: ++counter }), "scoped");
    const ctx1 = new DummyContext(root);
    const scope1 = root.createScope(ctx1);
    const i1 = scope1.get(t);
    const i2 = scope1.get(t);
    expect(i1.id).toBe(1);
    expect(i1).toBe(i2);
    const ctx2 = new DummyContext(root);
    const scope2 = root.createScope(ctx2);
    const i3 = scope2.get(t);
    expect(i3.id).toBe(2);
    expect(i3).not.toBe(i1);
  });
  test("unbound token throws UnboundTokenError", () => {
    const t = token("test");
    const container = new InMemoryContainer();
    expect(() => container.get(t)).toThrow(UnboundTokenError);
  });
  test("duplicate binding throws DuplicateBindingError", () => {
    const t = token("test");
    const container = new InMemoryContainer();
    container.bind(t, () => 1);
    expect(() => container.bind(t, () => 2)).toThrow(DuplicateBindingError);
  });
  test("circular dependency throws CircularDependencyError", () => {
    const tA = token<any>("A");
    const tB = token<any>("B");
    const container = new InMemoryContainer();
    container.bind(tA, (c) => c.get(tB), "transient");
    container.bind(tB, (c) => c.get(tA), "transient");
    expect(() => container.get(tA)).toThrow(CircularDependencyError);
  });
  test("bind on child container throws RootOnlyOperationError", () => {
    const root = new InMemoryContainer();
    const scope = root.createScope(new DummyContext(root));
    const t = token("test");
    expect(() => scope.bind(t, () => 1)).toThrow(RootOnlyOperationError);
  });

  test("late scoped bindings stay isolated in their child container", () => {
    const root = new InMemoryContainer();
    const value = token<number>("request-value");
    const first = root.createScope({} as ExecutionContext);
    const second = root.createScope({} as ExecutionContext);

    first.bind(value, () => 1, "scoped");
    second.bind(value, () => 2, "scoped");

    expect(first.get(value)).toBe(1);
    expect(second.get(value)).toBe(2);
    expect(() => root.get(value)).toThrow(UnboundTokenError);
  });
  test("child container resolves singleton registered in parent", () => {
    const root = new InMemoryContainer();
    const t = token<{id: number}>("t");
    let counter = 0;
    root.bind(t, () => ({ id: ++counter }), "singleton");
    const scope = root.createScope(new DummyContext(root));
    const i = scope.get(t);
    expect(i.id).toBe(1);
  });
  test("same singleton resolved from two child containers returns same instance", () => {
    const root = new InMemoryContainer();
    const t = token<{id: number}>("t");
    let counter = 0;
    root.bind(t, () => ({ id: ++counter }), "singleton");
    const scope1 = root.createScope(new DummyContext(root));
    const scope2 = root.createScope(new DummyContext(root));
    const i1 = scope1.get(t);
    const i2 = scope2.get(t);
    expect(i1).toBe(i2);
  });
});
