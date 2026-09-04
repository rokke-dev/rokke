import type { Container, ServiceProvider, ApplicationState, ExecutionContext } from "../contracts";
import { topologicalSort } from "./topological-sort";
import { InvalidStateTransitionError, BootError } from "./errors";
import { bootstrapReporter } from "../bootstrap-reporter";
export interface KernelOptions {
  /** Milliseconds that `drain()` waits for in-flight ExecutionContexts to finish before forcing shutdown. Default: 30000. */
  readonly drainTimeoutMs?: number;
}
export class Kernel {
  #state: ApplicationState = "created";
  #orderedProviders: ServiceProvider[] = [];
  #bootedProviders: ServiceProvider[] = [];
  readonly #rootContainer: Container;
  readonly #inFlightContexts = new Set<ExecutionContext>();
  readonly #drainTimeoutMs: number;
  constructor(rootContainer: Container, options: KernelOptions = {}) {
    this.#rootContainer = rootContainer;
    this.#drainTimeoutMs = options.drainTimeoutMs ?? 30_000;
  }
  get state(): ApplicationState {
    return this.#state;
  }
  registerProviders(providers: readonly ServiceProvider[]): void {
    this.#assertState("created", "registerProviders");
    this.#orderedProviders = topologicalSort(providers);
  }
  async start(): Promise<void> {
    this.#assertState("created", "start");
    this.#state = "registering";
    try {
      for (const provider of this.#orderedProviders) provider.register(this.#rootContainer);
    } catch (error) {
      this.#state = "errored";
      bootstrapReporter.error("register() falló, nada se booteó todavía", error);
      throw error;
    }
    this.#state = "booting";
    for (const provider of this.#orderedProviders) {
      try {
        await provider.boot();
        this.#bootedProviders.push(provider);
      } catch (error) {
        this.#state = "errored";
        bootstrapReporter.error(`boot() de ${provider.constructor.name} falló, revirtiendo providers ya booteados`, error);
        await this.#shutdownBooted();
        throw new BootError(provider, error);
      }
    }
    this.#state = "ready";
  }
  async shutdown(): Promise<void> {
    this.#assertState("ready", "shutdown");
    this.#state = "draining";
    await this.#waitForInFlightContexts();
    await this.#shutdownBooted();
    this.#state = "terminated";
  }
  trackExecutionContext(context: ExecutionContext): void {
    this.#inFlightContexts.add(context);
  }
  untrackExecutionContext(context: ExecutionContext): void {
    this.#inFlightContexts.delete(context);
  }
  getBootedProviders(): readonly ServiceProvider[] {
    return [...this.#bootedProviders];
  }
  async #shutdownBooted(): Promise<void> {
    for (const provider of [...this.#bootedProviders].reverse()) {
      await provider.shutdown();
    }
    this.#bootedProviders = [];
  }
  async #waitForInFlightContexts(): Promise<void> {
    const start = Date.now();
    while (this.#inFlightContexts.size > 0) {
      if (Date.now() - start >= this.#drainTimeoutMs) {
        bootstrapReporter.warn(
          `drain: ${this.#inFlightContexts.size} ExecutionContexts left unfinished after ${this.#drainTimeoutMs}ms — forcing shutdown anyway`,
        );
        return;
      }
      await new Promise((resolve) => setTimeout(resolve, 50));
    }
  }
  #assertState(expected: ApplicationState, attempted: string): void {
    if (this.#state !== expected) throw new InvalidStateTransitionError(this.#state, attempted);
  }
}
