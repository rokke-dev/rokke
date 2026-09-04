import { ServiceProvider, token, type Container, discoverModules, bindInjectable } from "@rokke/core";
import { ConfigProvider, ConfigToken } from "@rokke/config";
import { LoggerProvider } from "@rokke/logger";
import { Router, type RouterOptions } from "./router";
import { DebugInProductionError } from "./debug-in-production-error";
import type { ExceptionHandler } from "./exception-handler";
import type { HttpRequestContext } from "./http-request-context";
import { readControllerMetadata } from "./decorators";
export const RouterToken = token<Router>("Router");
export interface HttpProviderOptions {
  readonly routerOptions?: RouterOptions;
  readonly exceptionHandlers?: readonly ExceptionHandler[];
}
export class HttpProvider extends ServiceProvider {
  static override readonly dependsOn = [ConfigProvider, LoggerProvider];
  readonly #router: Router;
  readonly #exceptionHandlers: readonly ExceptionHandler[];
  #server: ReturnType<typeof Bun.serve> | undefined;
  constructor(app: import("@rokke/core").ApplicationContext, options: HttpProviderOptions = {}) {
    super(app);
    this.#router = new Router(options.routerOptions);
    this.#exceptionHandlers = options.exceptionHandlers ?? [];
  }
  override register(container: Container): void {
    container.bind(RouterToken, () => this.#router, "singleton");
  }
  getRouter(): Router {
    return this.#router;
  }
  override async boot(): Promise<void> {
    const config = this.app.container.get(ConfigToken);
    if (config.app.debug && config.app.env === "production") throw new DebugInProductionError();
    this.#registerHealthRoutes();
    await this.#discoverControllers();
    const httpConfig = config.http as { port?: number } | undefined; 
    this.#server = Bun.serve({
      port: httpConfig?.port ?? 3000,
      routes: this.#router.toBunRoutes(this.app, this.#exceptionHandlers),
      fetch: () => new Response(null, { status: 404 }), 
    });
  }
  async #discoverControllers(): Promise<void> {
    const config = this.app.container.get(ConfigToken);
    const pattern = (config.discovery as { controllers?: string } | undefined)?.controllers ?? "src/**/*.controller.ts";
    const prefix = (config.http as { prefix?: string } | undefined)?.prefix ?? "";
    const modules = await discoverModules(pattern, this.app.basePath);
    for (const { exports, filePath } of modules) {
      for (const exported of Object.values(exports)) {
        if (typeof exported !== "function") continue;
        const meta = readControllerMetadata(exported);
        if (!meta) continue;
        const instanceToken = token<object>("__controller__" + exported.name + "__" + filePath);
        bindInjectable(this.app.container, instanceToken, exported as never);
        const instance = this.app.container.get(instanceToken) as Record<string, (ctx: HttpRequestContext) => Promise<Response>>;
        for (const route of meta.routes ?? []) {
          const fullPath = meta.controllerBasePath! + route.path;
          this.#router.register({
            method: route.method,
            path: meta.controllerSkipPrefix ? fullPath : `${prefix}${fullPath}`,
            handler: (ctx) => instance[route.propertyKey]!(ctx),
          });
        }
      }
    }
  }
  override async shutdown(): Promise<void> {
    this.#server?.stop();
  }
  override async healthCheck() {
    return { status: "up" as const };
  }
  #registerHealthRoutes(): void {
    if (typeof this.app.getBootedProviders === "function") {
      this.#router.register({
        method: "GET",
        path: "/health",
        handler: async (ctx) => ctx.json({ status: "up" }),
      });
      this.#router.register({
        method: "GET",
        path: "/ready",
        handler: (ctx) => this.#handleReady(ctx),
      });
    }
  }
  async #handleReady(ctx: HttpRequestContext): Promise<Response> {
    const providers = this.app.getBootedProviders();
    const results = await Promise.all(
      providers
        .filter((p): p is typeof p & { healthCheck: NonNullable<typeof p.healthCheck> } => typeof p.healthCheck === "function")
        .map(async (p) => ({ provider: p.constructor.name, ...(await p.healthCheck!()) })),
    );
    const allUp = results.every((r) => r.status === "up");
    return ctx.json({ status: allUp ? "up" : "down", checks: results }, allUp ? 200 : 503);
  }
}