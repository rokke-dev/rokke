import { DisposableExecutionContext, type ApplicationContext, type Container } from "@rokke/core";
export class CliCommandContext extends DisposableExecutionContext {
  readonly kind = "cli" as const;
  readonly container: Container;
  readonly signal: AbortSignal;
  readonly correlationId: string;
  readonly args: readonly string[];
  readonly app: ApplicationContext;
  readonly #abortController = new AbortController();
  readonly #handleSignal = (): void => this.#abortController.abort();
  constructor(app: ApplicationContext, args: readonly string[]) {
    super();
    this.app = app;
    this.args = args;
    this.correlationId = crypto.randomUUID();
    this.signal = this.#abortController.signal;
    this.container = app.container.createScope(this);
    app.trackExecutionContext(this);
    process.on("SIGINT", this.#handleSignal);
  }
  toTraceParent(): string {
    const spanId = crypto.randomUUID().replace(/-/g, "").slice(0, 16);
    return `00-${this.correlationId}-${spanId}-01`;
  }
  writeOut(text: string): void {
    process.stdout.write(text);
  }
  protected reportDisposeError(error: unknown): void {
    console.error(`[rokke] Falló un callback de limpieza (correlationId=${this.correlationId}):`, error);
  }
  override async [Symbol.asyncDispose](): Promise<void> {
    try {
      await super[Symbol.asyncDispose]();
    } finally {
      process.off("SIGINT", this.#handleSignal);
      this.app.untrackExecutionContext(this);
    }
  }
}
