import type { Router, ExceptionHandler } from "@rokke/http";
import type { ApplicationContext, HttpMethod } from "@rokke/core";

export class HttpTestClient {
  readonly #server: ReturnType<typeof Bun.serve>;

  constructor(router: Router, app: ApplicationContext, exceptionHandlers: readonly ExceptionHandler[] = []) {
    this.#server = Bun.serve({
      port: 0,
      routes: router.toBunRoutes(app, exceptionHandlers) as any,
      fetch: () => new Response(null, { status: 404 }),
    });
  }

  async request(method: HttpMethod, path: string, init: RequestInit = {}): Promise<Response> {
    return fetch(`http://localhost:${this.#server.port}${path}`, { method, ...init });
  }

  async close(): Promise<void> {
    this.#server.stop();
  }
}
