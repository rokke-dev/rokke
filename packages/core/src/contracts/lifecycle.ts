/**
 * Determines how many instances a Container binding produces and how long they live.
 *
 * - `"singleton"` — ONE instance for the entire process. It is created the first
 *   time it is resolved (lazy, not at `bind()` time), memoized in the root Container
 *   (the one in `ApplicationContext`), and that same instance is returned no matter
 *   which `ExecutionContext` requests it.
 * - `"scoped"` — ONE instance per `ExecutionContext`. The first time it is resolved
 *   within a given context, it is memoized in the child Container of THAT context
 *   (the one returned by `createScope()`); requesting it again in the SAME context
 *   returns the same instance; requesting it from another context produces a new,
 *   independent instance.
 * - `"transient"` — a NEW instance on every call to `container.get()`, without
 *   memoizing anywhere, regardless of context.
 *
 * If `bind()` does not receive a `lifecycle`, the default is `"singleton"` (see Rule C-1).
 */
export type Lifecycle = "singleton" | "scoped" | "transient";