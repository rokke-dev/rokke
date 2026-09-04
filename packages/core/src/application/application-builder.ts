import type { ApplicationContext, ServiceProvider } from "../contracts";
import { Application } from "./application";
import { InMemoryContainer } from "../container";
import type { KernelOptions } from "../kernel";
import { discoverProviderClasses } from "../discovery";
type ProviderClass = new (app: ApplicationContext) => ServiceProvider;
export class ApplicationBuilder {
  readonly #basePath: string;
  #providerClasses: ProviderClass[] = [];
  #kernelOptions: KernelOptions = {};
  constructor(basePath: string) {
    this.#basePath = basePath;
  }
  withProviders(...providers: ProviderClass[]): this {
    this.#providerClasses.push(...providers);
    return this;
  }
  withDrainTimeout(ms: number): this {
    this.#kernelOptions = { ...this.#kernelOptions, drainTimeoutMs: ms };
    return this;
  }
  create(): Promise<Application> {
    return this.#createAsync();
  }
  async #createAsync(): Promise<Application> {
    const providerClasses = this.#providerClasses.length > 0
      ? this.#providerClasses
      : await discoverProviderClasses(this.#basePath);
    const rootContainer = new InMemoryContainer();
    return new Application(this.#basePath, rootContainer, providerClasses, this.#kernelOptions);
  }
}