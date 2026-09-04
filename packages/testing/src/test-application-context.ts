import { InMemoryContainer, type ApplicationContext, type ApplicationState, type Token } from "@rokke/core";
export interface TestBinding<T> { readonly token: Token<T>; readonly value: T; }
export function bindTest<T>(token: Token<T>, value: T): TestBinding<T> {
  return { token, value };
}
export function createTestApplicationContext(bindings: readonly TestBinding<unknown>[] = []): ApplicationContext {
  const container = new InMemoryContainer();
  for (const { token, value } of bindings) container.bind(token, () => value, "singleton");
  const state: ApplicationState = "ready";
  return {
    container,
    basePath: "/test",
    get state() { return state; },
    trackExecutionContext: () => {},
    untrackExecutionContext: () => {},
    getBootedProviders: () => [],
  };
}
