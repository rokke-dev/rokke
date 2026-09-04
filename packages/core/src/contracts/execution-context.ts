import type { Container } from "./container";
/**
 * Base class for all execution contexts.
 */
export abstract class ExecutionContext {
  abstract readonly kind: "http" | "cli" | "job" | "scheduled";
  /** Returned by Container.createScope(this) - see Phase 2. */
  abstract readonly container: Container;
  /** Abort signal for the execution. */
  abstract readonly signal: AbortSignal;
  /** Correlation ID for tracing. */
  abstract readonly correlationId: string;
  abstract toTraceParent(): string;
  /**
   * Generic registry of cleanup callbacks, so a "scoped" resource
   * (a @rokke/orm transaction, for example) can guarantee its own release
   * without ExecutionContext needing to know what a transaction is.
   * Any code that resolves a scoped resource from currentExecutionContext()
   * can call onDispose(cleanup).
   */
  abstract readonly onDispose: (cleanup: () => Promise<void>) => void;
  /**
   * INVARIANT - applies to EVERY future concrete implementation, not just
   * HTTP: this method can only complete when ALL "scoped" resources resolved
   * during the life of this context have been released (connections closed,
   * transactions in commit or rollback) - in practice, when all onDispose
   * callbacks have run.
   */
  abstract [Symbol.asyncDispose](): Promise<void>;
}