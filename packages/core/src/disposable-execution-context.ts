import { ExecutionContext } from "./contracts";
export abstract class DisposableExecutionContext extends ExecutionContext {
  readonly #disposeCallbacks: Array<() => Promise<void>> = [];
  onDispose = (cleanup: () => Promise<void>): void => {
    this.#disposeCallbacks.push(cleanup);
  };
  async [Symbol.asyncDispose](): Promise<void> {
    for (const cleanup of [...this.#disposeCallbacks].reverse()) {
      try {
        await cleanup();
      } catch (error) {
        this.reportDisposeError(error);
      }
    }
  }
  protected abstract reportDisposeError(error: unknown): void;
}