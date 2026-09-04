import type { Container, Token, Lifecycle } from "../contracts";
import { UnboundTokenError, DuplicateBindingError, CircularDependencyError } from "../contracts";
import { RootOnlyOperationError } from "./errors";
import type { ExecutionContext } from "../contracts";
interface Binding<T> {
  readonly factory: (container: Container) => T;
  readonly lifecycle: Lifecycle;
}
export class InMemoryContainer implements Container {
  readonly #bindings = new Map<Token<unknown>, Binding<unknown>>();
  readonly #singletonCache = new Map<Token<unknown>, unknown>();
  readonly #scopedCache = new Map<Token<unknown>, unknown>();
  readonly #resolutionStack: Token<unknown>[] = [];
  readonly #parent: InMemoryContainer | undefined;
  /** @param parent If omitted, this Container IS the root. */
  constructor(parent?: InMemoryContainer) {
    this.#parent = parent;
  }
  bind<T>(tok: Token<T>, factory: (container: Container) => T, lifecycle: Lifecycle = "singleton"): void {
    if (this.#parent && lifecycle !== "scoped") throw new RootOnlyOperationError();
    if (this.#bindings.has(tok)) throw new DuplicateBindingError(tok);
    this.#bindings.set(tok, { factory, lifecycle });
  }
  get<T>(tok: Token<T>): T {
    if (this.#resolutionStack.includes(tok)) {
      throw new CircularDependencyError([...this.#resolutionStack, tok]);
    }
    const binding = this.#findBinding(tok);
    if (!binding) throw new UnboundTokenError(tok);
    if (binding.lifecycle === "singleton") return this.#resolveMemoized(tok, binding, this.#root().#singletonCache);
    if (binding.lifecycle === "scoped") return this.#resolveMemoized(tok, binding, this.#scopedCache);
    return this.#resolveFresh(tok, binding); 
  }
  createScope(_context: ExecutionContext): Container {
    return new InMemoryContainer(this);
  }
  #resolveMemoized<T>(tok: Token<T>, binding: Binding<T>, cache: Map<Token<unknown>, unknown>): T {
    if (cache.has(tok)) return cache.get(tok) as T;
    const instance = this.#resolveFresh(tok, binding);
    cache.set(tok, instance);
    return instance;
  }
  #resolveFresh<T>(tok: Token<T>, binding: Binding<T>): T {
    this.#resolutionStack.push(tok);
    try {
      return binding.factory(this);
    } finally {
      this.#resolutionStack.pop();
    }
  }
  #findBinding<T>(tok: Token<T>): Binding<T> | undefined {
    return (this.#bindings.get(tok) as Binding<T> | undefined) ?? (this.#parent ? this.#parent.#findBinding(tok) : undefined);
  }
  #root(): InMemoryContainer {
    return this.#parent ? this.#parent.#root() : this;
  }
}
