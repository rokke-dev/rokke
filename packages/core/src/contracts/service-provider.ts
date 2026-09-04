import type { Container } from "./container";
import type { ApplicationContext } from "./application-context";
/**
 * Base class for all service providers.
 */
export abstract class ServiceProvider {
  /**
   * Providers that must complete THEIR ENTIRE `register()` + `boot()` cycle
   * before this provider starts its own. Optional — if omitted, the order between
   * providers without declared dependency relationship is the discovery order
   * (Phase 5: alphabetical order of the path returned by `Glob.scan()`) — the SAME
   * order on every startup, deterministic, so that an order bug is reproducible and
   * not an intermittent flake.
   */
  static readonly dependsOn?: ReadonlyArray<new (app: ApplicationContext) => ServiceProvider>;
  /**
   * Creates a new service provider instance.
   *
   * @param app The application context.
   */
  protected readonly app: ApplicationContext;
  constructor(app: ApplicationContext) {
    this.app = app;
  }
  /**
   * `Registering` phase of the state machine (Phase 2, §5). Only `container.bind(...)`
   * calls. Forbidden to perform I/O here — opening a connection, reading a file,
   * making a network request. This prohibition CANNOT be verified at compile time in this
   * phase (Phase 1 is only types); how it is enforced at runtime is an open question
   * for Phase 2 (§10, question #1).
   *
   * @param _container The dependency injection container.
   */
  register(_container: Container): void {}
  /**
   * `Booting` phase. Here it is allowed to resolve from the container and perform
   * async I/O (open connection pools, register `Bun.serve` handler without listening yet,
   * schedule cron).
   */
  async boot(): Promise<void> {}
  /**
   * `Draining` phase, executed in REVERSE order to `boot()` order (constructor/destructor symmetry).
   */
  async shutdown(): Promise<void> {}
  /**
   * Optional. If implemented, it is automatically added to `GET /ready` the day
   * `@rokke/http` exists (Phase 4/7) — in this phase there is nothing invoking it yet.
   *
   * @returns Health status information.
   */
  healthCheck?(): Promise<{ status: "up" | "down" | "degraded"; detail?: string }>;
}
/**
 * Thrown when the `dependsOn` graph between providers has a cycle — detected before
 * executing any `register()`, during the `Created → Registering` transition (Phase 2, §5).
 */
export class ProviderDependencyCycleError extends Error {
  public readonly chain: ReadonlyArray<Function>;
  constructor(chain: ReadonlyArray<Function>) {
    super(`Dependency cycle between providers: ${chain.map((f) => f.name).join(" -> ")}`);
    this.name = "ProviderDependencyCycleError";
    this.chain = chain;
  }
}
