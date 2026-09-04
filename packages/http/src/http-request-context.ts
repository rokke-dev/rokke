import { DisposableExecutionContext, type ApplicationContext, type Container } from "@rokke/core";
import { LoggerToken } from "@rokke/logger";
import type { Schema } from "@rokke/validation";
import type { ProblemDetails } from "./problem-details";
import type { CachePolicy } from "./cache-policy";
import { assertValidHeaderValue } from "./header-guard";
import { safeJsonStringify } from "./safe-json";
import { readBody } from "./read-body";
export class HttpRequestContext extends DisposableExecutionContext {
  readonly kind = "http" as const;
  readonly container: Container;
  readonly signal: AbortSignal;
  readonly request: Request;
  readonly params: Record<string, string>;
  readonly correlationId: string;
  constructor(app: ApplicationContext, request: Request, params: Record<string, string>) {
    super();
    this.container = app.container.createScope(this);
    this.signal = request.signal;
    this.request = request;
    this.params = params;
    this.correlationId = request.headers.get("X-Correlation-ID") ?? crypto.randomUUID();
    app.trackExecutionContext(this);
  }
  toTraceParent(): string {
    const spanId = crypto.getRandomValues(new Uint8Array(8)).reduce((str, byte) => str + byte.toString(16).padStart(2, "0"), "");
    return `00-${this.correlationId}-${spanId}-01`;
  }
  protected reportDisposeError(error: unknown): void {
    const logger = this.container.get(LoggerToken as never) as any;
    logger.error("Falló un callback de limpieza en la disposición del ExecutionContext", { correlationId: this.correlationId, error });
  }
  header(name: string, value: string): this {
    assertValidHeaderValue(name, value);
    this.request.headers.set(name, value);
    return this;
  }
  matchesEtag(etag: string): boolean {
    const ifNoneMatch = this.request.headers.get("If-None-Match");
    return ifNoneMatch === etag;
  }
  redirect(url: string, status: 301 | 302 | 303 | 307 | 308 = 302): Response {
    assertValidHeaderValue("Location", url);
    return new Response(null, { status, headers: { Location: url } });
  }
  noContent(): Response {
    return new Response(null, { status: 204 });
  }
  notModified(): Response {
    return new Response(null, { status: 304 });
  }
  json(data: unknown, status = 200): Response {
    const body = safeJsonStringify(data);
    const headers = new Headers({ "Content-Type": "application/json; charset=utf-8" });
    for (const [k, v] of this.request.headers.entries()) {
      headers.set(k, v);
    }
    return new Response(body, { status, headers });
  }
  cache(policy: CachePolicy): this {
    const parts: string[] = [];
    if (policy.public) parts.push("public");
    if (policy.maxAge !== undefined) parts.push(`max-age=${policy.maxAge}`);
    if (policy.staleWhileRevalidate !== undefined) parts.push(`stale-while-revalidate=${policy.staleWhileRevalidate}`);
    if (policy.mustRevalidate) parts.push("must-revalidate");
    if (policy.noStore) parts.push("no-store");
    if (parts.length > 0) {
      this.header("Cache-Control", parts.join(", "));
    }
    return this;
  }
  created(location: string, data: unknown): Response {
    this.header("Location", location);
    return this.json(data, 201);
  }
  problem(details: ProblemDetails): Response {
    const body = safeJsonStringify(details);
    return new Response(body, {
      status: details.status,
      headers: { "Content-Type": "application/problem+json" },
    });
  }
  async input<T>(schema: Schema<T>): Promise<T> {
    const url = new URL(this.request.url);
    let rawBody: unknown = undefined;
    if (this.request.method !== "GET" && this.request.method !== "HEAD") {
      rawBody = await readBody(this.request);
    }
    const payload = {
      ...this.params,
      ...Object.fromEntries(url.searchParams.entries()),
      ...(typeof rawBody === "object" && rawBody !== null ? rawBody : {})
    };
    const result = schema.safeParse(payload);
    if (!result.success) {
      throw new InputValidationError(result.errors);
    }
    return result.data;
  }
  view(name: string, data: Record<string, unknown> = {}): Promise<Response> {
    throw new Error("El método view() requiere que se registre ViewProvider en la aplicación.");
  }
}
export class InputValidationError extends Error {
  public readonly errors: readonly import("@rokke/validation").ValidationIssue[];
  constructor(errors: readonly import("@rokke/validation").ValidationIssue[]) {
    super("Validación de input falló");
    this.name = "InputValidationError";
    this.errors = errors;
  }
}
