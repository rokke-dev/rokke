import type { Container } from "./container";
import type { ApplicationState } from "./application-state";
import type { ExecutionContext } from "./execution-context";
import type { ServiceProvider } from "./service-provider";
/**
 * Represents the root application context.
 */
export interface ApplicationContext {
  /** The root Container of the process — "singleton" bindings live here. */
  readonly container: Container;
  /** The current state of the application. */
  readonly state: ApplicationState;
  /**
   * Absolute path to the project root, as passed to `Application.boot(basePath)`.
   * Used by `@rokke/config` (Phase 3, to locate `config/*.ts`) and the discovery
   * mechanism (Phase 5, to locate `**\\/*.controller.ts` and similar) — any
   * package that needs to resolve a project-relative path derives it from here,
   * never from `process.cwd()` (which might not match the project root).
   */
  readonly basePath: string;
  /**
   * Registers an `ExecutionContext` as "in flight" with the `Kernel`
   * so that `draining` phase knows to wait for it.
   */
  readonly trackExecutionContext: (context: ExecutionContext) => void;
  /** Untracks an execution context after it finishes. */
  readonly untrackExecutionContext: (context: ExecutionContext) => void;
  /**
   * The `ServiceProvider`s whose `boot()` has completed, in boot order.
   * Used by `GET /ready` to aggregate their `healthCheck()` results.
   */
  readonly getBootedProviders: () => readonly ServiceProvider[];
}
