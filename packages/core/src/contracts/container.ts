import type { Token } from "./token";
import type { Lifecycle } from "./lifecycle";
import type { ExecutionContext } from "./execution-context";
/**
 * The dependency injection container.
 */
export interface Container {
  /**
   * Registers how to build an instance for a `token`.
   *
   * @param token The token representing the dependency.
   * @param factory Receives the Container itself (to resolve other dependencies
   *   inside the factory) and MUST return an instance of `T` synchronously.
   *   If building the instance requires async operations (e.g., opening a network
   *   connection), that DOES NOT go here — it goes in `ServiceProvider.boot()` (Phase 2),
   *   which is async. The `bind()` factory only assembles the object in memory
   *   from already resolved dependencies; it never performs I/O.
   * @param lifecycle See {@link Lifecycle}. Default: `"singleton"`.
   *
   * @throws {DuplicateBindingError} if `token` already has a binding
   *   registered in this Container. There is no "last call wins": a duplicate
   *   binding is almost always a bug — two `ServiceProvider`s registering the same
   *   token without noticing — and silencing it with an implicit overwrite would leave it
   *   invisible until production.
   */
  bind<T>(token: Token<T>, factory: (container: Container) => T, lifecycle?: Lifecycle): void;
  /**
   * Resolves an instance for a `token`, applying its {@link Lifecycle}.
   *
   * @param token The token representing the dependency to resolve.
   * @returns The resolved instance.
   *
   * @throws {UnboundTokenError} if `token` has no binding registered in this Container
   *   nor in any of its parent Containers (a child Container, created by `createScope()`,
   *   CAN resolve bindings inherited from the parent).
   * @throws {CircularDependencyError} if resolving `token` requires, directly or
   *   transitively, resolving `token` again before its own factory finishes executing.
   */
  get<T>(token: Token<T>): T;
  /**
   * Creates a child Container, tied to a specific `ExecutionContext`.
   *
   * The child:
   * - Resolves `"scoped"` bindings by memoizing in ITS OWN instance cache,
   *   independent of any other child and the parent.
   * - For `"singleton"` bindings, it delegates to the parent — sharing the same
   *   instance as any other Container in the process.
   * - Resolves `"transient"` just like the parent: never memoizes.
   * - Accepts only late `"scoped"` bindings owned by that child (for values such as
   *   an authenticated principal that do not exist before the request starts).
   *   Singleton and transient bindings remain root-only.
   *
   * @param context The execution context for this scope.
   * @returns The scoped container.
   *
   * @remarks Who calls this method and at what exact moment is a Phase 2 decision
   *   (§10, open question #4) — this contract only fixes the behavior that caller should expect.
   */
  createScope(context: ExecutionContext): Container;
}
/** Thrown from {@link Container.get} when `token` has no binding. */
export class UnboundTokenError extends Error {
  public readonly token: Token<unknown>;
  constructor(token: Token<unknown>) {
    super(`No binding registered for token "${String(token)}".`);
    this.name = "UnboundTokenError";
    this.token = token;
  }
}
/** Thrown from {@link Container.bind} when `token` already had a binding. */
export class DuplicateBindingError extends Error {
  public readonly token: Token<unknown>;
  constructor(token: Token<unknown>) {
    super(`Token "${String(token)}" already has a registered binding — bind() does not overwrite, it fails.`);
    this.name = "DuplicateBindingError";
    this.token = token;
  }
}
/** Thrown from {@link Container.get} when a resolution cycle is detected. */
export class CircularDependencyError extends Error {
  public readonly chain: ReadonlyArray<Token<unknown>>;
  constructor(chain: ReadonlyArray<Token<unknown>>) {
    super(`Circular dependency detected: ${chain.map(String).join(" -> ")}`);
    this.name = "CircularDependencyError";
    this.chain = chain;
  }
}
