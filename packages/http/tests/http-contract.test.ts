import { describe, expect, test } from "bun:test";
import { InMemoryContainer, type ApplicationContext, type ExecutionContext } from "@rokke/core";
import { ConfigToken, type AppConfig } from "@rokke/config";
import { LoggerToken, type Logger } from "@rokke/logger";
import { Schema } from "@rokke/validation";
import {
  DuplicateRouteError,
  ExceptionHandler,
  HeaderInjectionError,
  HttpRequestContext,
  InputValidationError,
  RouteTable,
  Router,
  SerializationError,
  assertValidHeaderValue,
  composeMiddleware,
  readBody,
  resolveException,
  safeJsonStringify,
  type Middleware,
  type ProblemDetails,
} from "../src";
import { renderDebugPage, renderGenericErrorPage } from "../src/debug-page";

interface TestApp extends ApplicationContext {
  readonly tracked: ExecutionContext[];
  readonly untracked: ExecutionContext[];
}

function createApp(config: AppConfig = { app: { name: "Test", env: "development", debug: false } }): TestApp {
  const container = new InMemoryContainer();
  const logger: Logger = {
    debug() {}, info() {}, warn() {}, error() {}, critical() {}, channel() { return this; },
  };
  container.bind(ConfigToken, () => config);
  container.bind(LoggerToken, () => logger);
  const tracked: ExecutionContext[] = [];
  const untracked: ExecutionContext[] = [];
  return {
    basePath: import.meta.dir,
    container,
    state: "ready",
    tracked,
    untracked,
    trackExecutionContext: (ctx) => tracked.push(ctx),
    untrackExecutionContext: (ctx) => untracked.push(ctx),
    getBootedProviders: () => [],
  };
}

function createContext(request = new Request("http://localhost/items"), params: Record<string, string> = {}) {
  const app = createApp();
  return { app, ctx: new HttpRequestContext(app, request, params) };
}

describe("HttpRequestContext contract", () => {
  test("tracks the context and propagates correlation information", () => {
    const request = new Request("http://localhost/items", { headers: { "X-Correlation-ID": "0123456789abcdef0123456789abcdef" } });
    const { app, ctx } = createContext(request);
    expect(app.tracked).toEqual([ctx]);
    expect(ctx.correlationId).toBe("0123456789abcdef0123456789abcdef");
    expect(ctx.toTraceParent()).toMatch(/^00-0123456789abcdef0123456789abcdef-[0-9a-f]{16}-01$/);
  });

  test("response helpers preserve their documented status and headers", async () => {
    const request = new Request("http://localhost/items", { headers: { "If-None-Match": "v1" } });
    const { ctx } = createContext(request);
    expect(ctx.matchesEtag("v1")).toBe(true);
    expect(ctx.noContent().status).toBe(204);
    expect(ctx.notModified().status).toBe(304);
    expect(ctx.redirect("/next", 303).headers.get("Location")).toBe("/next");

    ctx.cache({ public: true, maxAge: 60, staleWhileRevalidate: 10, mustRevalidate: true, noStore: true });
    const created = ctx.created("/items/1", { id: 1 });
    expect(created.status).toBe(201);
    expect(created.headers.get("Location")).toBe("/items/1");
    expect(created.headers.get("Cache-Control")).toBe("public, max-age=60, stale-while-revalidate=10, must-revalidate, no-store");
    expect(await created.json()).toEqual({ id: 1 });

    const problem = ctx.problem({ type: "about:blank", title: "Bad", status: 400 });
    expect(problem.status).toBe(400);
    expect(problem.headers.get("Content-Type")).toBe("application/problem+json");
  });

  test("rejects unsafe header and redirect values", () => {
    const { ctx } = createContext();
    expect(() => ctx.header("X-Test", "safe")).not.toThrow();
    expect(() => assertValidHeaderValue("X-Test", "bad\r\nInjected: yes")).toThrow(HeaderInjectionError);
    expect(() => ctx.redirect("/safe\nInjected: yes")).toThrow(HeaderInjectionError);
  });

  test("input combines params, query and JSON body", async () => {
    const request = new Request("http://localhost/items?source=query", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "Rokke" }),
    });
    const { ctx } = createContext(request, { id: "42" });
    const result = await ctx.input(Schema.object({
      id: Schema.string(),
      source: Schema.string(),
      name: Schema.string(),
    }));
    expect(result).toEqual({ id: "42", source: "query", name: "Rokke" });
  });

  test("input validates GET data without reading a body", async () => {
    const { ctx } = createContext(new Request("http://localhost/items?name=Rokke"));
    expect(await ctx.input(Schema.object({ name: Schema.string() }))).toEqual({ name: "Rokke" });
  });

  test("input exposes validation issues through InputValidationError", async () => {
    const { ctx } = createContext();
    await expect(ctx.input(Schema.object({ id: Schema.string() }))).rejects.toBeInstanceOf(InputValidationError);
  });

  test("view reports that the optional provider is absent", () => {
    const { ctx } = createContext();
    expect(() => ctx.view("home")).toThrow("ViewProvider");
  });

  test("dispose errors are reported and do not stop later cleanup", async () => {
    const app = createApp();
    const errors: unknown[] = [];
    const logger: Logger = {
      debug() {}, info() {}, warn() {}, critical() {}, channel() { return this; },
      error(_message, meta) { errors.push(meta?.error); },
    };
    const container = app.container as InMemoryContainer;
    // The test app already has a logger binding, so use a dedicated app for this behavior.
    const errorContainer = new InMemoryContainer();
    errorContainer.bind(ConfigToken, () => ({ app: { name: "Test", env: "development", debug: false } }));
    errorContainer.bind(LoggerToken, () => logger);
    const errorApp = { ...app, container: errorContainer };
    const ctx = new HttpRequestContext(errorApp, new Request("http://localhost"), {});
    const calls: string[] = [];
    ctx.onDispose(async () => { calls.push("first"); });
    ctx.onDispose(async () => { calls.push("second"); throw new Error("cleanup"); });
    await ctx[Symbol.asyncDispose]();
    expect(calls).toEqual(["second", "first"]);
    expect(errors).toHaveLength(1);
    expect(container).toBeDefined();
  });
});

describe("body and JSON safety", () => {
  test("reads urlencoded and multipart bodies", async () => {
    const urlencoded = new Request("http://localhost", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: "name=Rokke&active=true",
    });
    expect(await readBody(urlencoded)).toEqual({ name: "Rokke", active: "true" });

    const form = new FormData();
    form.set("name", "Rokke");
    form.set("avatar", new Blob(["data"], { type: "text/plain" }), "avatar.txt");
    const multipart = await readBody(new Request("http://localhost", { method: "POST", body: form }));
    expect((multipart as Record<string, unknown>).name).toBe("Rokke");
    expect((multipart as Record<string, { filename: string }>).avatar!.filename).toBe("avatar.txt");
  });

  test("returns undefined for unsupported bodies", async () => {
    const request = new Request("http://localhost", { method: "POST", body: "plain" });
    expect(await readBody(request)).toBeUndefined();
  });

  test("rejects undefined roots and BigInt while serializing JSON", () => {
    expect(() => safeJsonStringify(undefined)).toThrow(SerializationError);
    expect(() => safeJsonStringify({ id: 1n })).toThrow(SerializationError);
    expect(safeJsonStringify({ ok: true })).toBe('{"ok":true}');
  });
});

describe("routing contracts", () => {
  test("RouteTable rejects duplicates and reports allowed methods", () => {
    const table = new RouteTable();
    table.register({ method: "GET", path: "/items", handler: async () => new Response() });
    expect(() => table.register({ method: "GET", path: "/items", handler: async () => new Response() })).toThrow(DuplicateRouteError);
    expect(table.resolve("/missing", "GET")).toBeUndefined();
    expect(table.resolve("/items", "HEAD")?.method).toBe("GET");
    expect(table.methodsFor("/items")).toEqual(["GET", "HEAD", "OPTIONS"]);
    expect(table.methodsFor("/missing")).toEqual([]);
  });

  test("Router handles OPTIONS, CORS preflight and method not allowed", async () => {
    const app = createApp();
    const router = new Router({
      corsPreflightResolver: (request, allowed) => request.headers.has("Origin")
        ? new Response(null, { status: 204, headers: { "X-Allow": allowed.join("|") } })
        : undefined,
    });
    router.register({ method: "GET", path: "/items", handler: async () => new Response("ok") });
    const handler = router.toBunRoutes(app, [])["/items"]!;

    const options = await handler(new Request("http://localhost/items", { method: "OPTIONS" }));
    expect(options.headers.get("Allow")).toBe("GET, HEAD, OPTIONS");
    const cors = await handler(new Request("http://localhost/items", { method: "OPTIONS", headers: { Origin: "https://example.test" } }));
    expect(cors.headers.get("X-Allow")).toBe("GET|HEAD|OPTIONS");
    const rejected = await handler(new Request("http://localhost/items", { method: "DELETE" }));
    expect(rejected.status).toBe(405);
  });

  test("global and route middleware execute in order", async () => {
    const calls: string[] = [];
    const middleware = (name: string): Middleware => ({
      async handle(_ctx, next) { calls.push(`${name}:before`); const response = await next(); calls.push(`${name}:after`); return response; },
    });
    const router = new Router();
    router.use(middleware("global"));
    router.register({
      method: "GET",
      path: "/items",
      handler: async () => { calls.push("handler"); return new Response("ok"); },
    }, [middleware("route")]);
    const response = await router.toBunRoutes(createApp(), [])["/items"]!(new Request("http://localhost/items"));
    expect(await response.text()).toBe("ok");
    expect(calls).toEqual(["global:before", "route:before", "handler", "route:after", "global:after"]);
  });

  test("composeMiddleware rejects calling next twice", async () => {
    const twice: Middleware = { async handle(_ctx, next) { await next(); return next(); } };
    const { ctx } = createContext();
    await expect(composeMiddleware([twice], async () => new Response())(ctx)).rejects.toThrow("más de una vez");
  });
});

class KnownErrorHandler extends ExceptionHandler<Error> {
  supports(error: Error): error is Error { return error.message === "known"; }
  handle(_error: Error): ProblemDetails { return { type: "known", title: "Known", status: 409 }; }
}

describe("exception responses", () => {
  test("uses a matching problem handler for JSON", async () => {
    const app = createApp();
    const ctx = new HttpRequestContext(app, new Request("http://localhost", { headers: { Accept: "application/json" } }), {});
    const response = await resolveException(new Error("known"), ctx, [new KnownErrorHandler()]);
    expect(response.status).toBe(409);
    expect(await response.json()).toMatchObject({ type: "known" });
  });

  test("hides production error detail and renders generic HTML", async () => {
    const app = createApp({ app: { name: "Test", env: "production", debug: false } });
    const ctx = new HttpRequestContext(app, new Request("http://localhost", { headers: { Accept: "text/html" } }), {});
    const response = await resolveException(new Error("secret detail"), ctx, []);
    expect(await response.text()).not.toContain("secret detail");
    expect(renderGenericErrorPage("ref-1").status).toBe(500);
  });

  test("renders escaped debug information when debug is enabled", async () => {
    const app = createApp({ app: { name: "Test", env: "development", debug: true } });
    const ctx = new HttpRequestContext(app, new Request("http://localhost", { headers: { Accept: "text/html" } }), {});
    const response = await resolveException(new Error("<unsafe>"), ctx, []);
    const html = await response.text();
    expect(html).toContain("&lt;unsafe&gt;");
    expect(renderDebugPage(new Error("test"), ctx).status).toBe(500);
  });
});
