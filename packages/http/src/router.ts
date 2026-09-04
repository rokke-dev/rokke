import type { ApplicationContext, HttpMethod, RouteDefinition } from "@rokke/core";
import { runInExecutionContext } from "@rokke/core";
import { RouteTable } from "./route-table";
import { HttpRequestContext } from "./http-request-context";
import type { ExceptionHandler } from "./exception-handler";
import { resolveException } from "./resolve-exception";
import { finalizeResponse } from "./finalize-response";
import { composeMiddleware, type Middleware } from "./middleware";
interface BunRequestLike extends Request {
  readonly params?: Record<string, string>;
}
export interface RouterOptions {
  readonly corsPreflightResolver?: (request: Request, allowedMethods: HttpMethod[]) => Response | undefined;
}
export class Router {
  readonly #table = new RouteTable();
  readonly #options: RouterOptions;
  readonly #globalMiddleware: Middleware[] = [];
  constructor(options: RouterOptions = {}) {
    this.#options = options;
  }
  register(route: RouteDefinition<HttpRequestContext>, middleware: readonly Middleware[] = []): void {
    this.#table.register(route, middleware);
  }
  use(middleware: Middleware): void {
    this.#globalMiddleware.push(middleware);
  }
  toBunRoutes(app: ApplicationContext, exceptionHandlers: readonly ExceptionHandler[]): Record<string, (req: Request) => Promise<Response>> {
    const bunRoutes: Record<string, (req: Request) => Promise<Response>> = {};
    for (const path of this.#table.paths()) {
      bunRoutes[path] = (req) => this.#dispatch(path, req as BunRequestLike, app, exceptionHandlers);
    }
    return bunRoutes;
  }
  async #dispatch(
    path: string,
    req: BunRequestLike,
    app: ApplicationContext,
    exceptionHandlers: readonly ExceptionHandler[],
  ): Promise<Response> {
    const method = req.method as HttpMethod;
    if (method === "OPTIONS") {
      const allowed = this.#table.methodsFor(path);
      const preflight = this.#options.corsPreflightResolver?.(req, allowed);
      if (preflight) return preflight;
      return new Response(null, { status: 204, headers: { Allow: allowed.join(", ") } });
    }
    const route = this.#table.resolve(path, method);
    if (!route) {
      const allowed = this.#table.methodsFor(path);
      return new Response(null, { status: 405, headers: { Allow: allowed.join(", ") } });
    }
    const ctx = new HttpRequestContext(app, req, req.params ?? {});
    const chain = [...this.#globalMiddleware, ...route.middleware];
    const dispatchHandler = composeMiddleware(chain, route.handler);
    let response: Response;
    try {
      response = await runInExecutionContext(ctx, () => dispatchHandler(ctx));
    } catch (error) {
      response = await resolveException(error, ctx, exceptionHandlers);
    }
    if (method === "HEAD") response = new Response(null, { status: response.status, headers: response.headers });
    return finalizeResponse(response, ctx, app);
  }
}
