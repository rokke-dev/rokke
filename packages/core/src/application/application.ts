import { ApplicationBuilder } from "./application-builder";
import type { ApplicationContext, ServiceProvider } from "../contracts";
import type { Container } from "../contracts/container";
import { Kernel, type KernelOptions } from "../kernel";
import type { ApplicationState, ExecutionContext } from "../contracts";
type ProviderClass = new (app: ApplicationContext) => ServiceProvider;
export class Application implements ApplicationContext {
  static boot(basePath: string): ApplicationBuilder {
    return new ApplicationBuilder(basePath);
  }

  readonly container: Container;
  readonly basePath: string;
  readonly #kernel: Kernel;
  readonly #handleSignal = (): void => {
    if (this.state === "ready") void this.shutdown();
  };
  #signalHandlersInstalled = false;
  constructor(basePath: string, rootContainer: Container, providerClasses: readonly ProviderClass[], options?: KernelOptions) {
    this.basePath = basePath;
    this.container = rootContainer;
    this.#kernel = new Kernel(rootContainer, options);
    const providerInstances = providerClasses.map((P) => new P(this));
    this.#kernel.registerProviders(providerInstances);
    this.#installSignalHandlers();
  }
  get state(): ApplicationState {
    return this.#kernel.state;
  }
  trackExecutionContext = (context: ExecutionContext): void => {
    this.#kernel.trackExecutionContext(context);
  };
  untrackExecutionContext = (context: ExecutionContext): void => {
    this.#kernel.untrackExecutionContext(context);
  };
  getBootedProviders = (): readonly ServiceProvider[] => {
    return this.#kernel.getBootedProviders();
  };
  async start(): Promise<void> {
    try {
      return await this.#kernel.start();
    } catch (error) {
      this.#removeSignalHandlers();
      throw error;
    }
  }
  async shutdown(): Promise<void> {
    try {
      return await this.#kernel.shutdown();
    } finally {
      this.#removeSignalHandlers();
    }
  }
  #installSignalHandlers(): void {
    process.on("SIGINT", this.#handleSignal);
    process.on("SIGTERM", this.#handleSignal);
    this.#signalHandlersInstalled = true;
  }
  #removeSignalHandlers(): void {
    if (!this.#signalHandlersInstalled) return;
    process.off("SIGINT", this.#handleSignal);
    process.off("SIGTERM", this.#handleSignal);
    this.#signalHandlersInstalled = false;
  }
}
