import type { HttpMethod, RouteDefinition } from "@rokke/core";
import type { HttpRequestContext } from "./http-request-context";
import type { Middleware } from "./middleware";
export interface RegisteredRoute {
  readonly method: HttpMethod;
  readonly handler: (ctx: HttpRequestContext) => Promise<Response>;
  readonly middleware: readonly Middleware[];
}
export class DuplicateRouteError extends Error {
  readonly method: HttpMethod;
  readonly path: string;
  constructor(method: HttpMethod, path: string) {
    super(`Ya existe una ruta registrada para ${method} ${path}.`);
    this.method = method;
    this.path = path;
    this.name = "DuplicateRouteError";
  }
}
export class RouteTable {
  readonly #routes = new Map<string, Map<HttpMethod, RegisteredRoute>>();
  register(route: RouteDefinition<HttpRequestContext>, middleware: readonly Middleware[] = []): void {
    if (!this.#routes.has(route.path)) this.#routes.set(route.path, new Map());
    const methods = this.#routes.get(route.path)!;
    if (methods.has(route.method)) throw new DuplicateRouteError(route.method, route.path);
    methods.set(route.method, { method: route.method, handler: route.handler, middleware });
  }
  resolve(path: string, method: HttpMethod): RegisteredRoute | undefined {
    const methods = this.#routes.get(path);
    if (!methods) return undefined;
    if (methods.has(method)) return methods.get(method);
    if (method === "HEAD" && methods.has("GET")) return methods.get("GET");
    return undefined;
  }
  methodsFor(path: string): HttpMethod[] {
    const methods = this.#routes.get(path);
    if (!methods) return [];
    const set = new Set<HttpMethod>(methods.keys());
    if (set.has("GET")) set.add("HEAD");
    set.add("OPTIONS");
    return [...set];
  }
  paths(): string[] {
    return [...this.#routes.keys()];
  }
}
