export interface RateLimitStore {
  increment(key: string, windowMs: number): Promise<{ count: number; resetAt: number }>;
}
export class InMemoryRateLimitStore implements RateLimitStore {
  #buckets = new Map<string, { count: number; resetAt: number }>();
  async increment(key: string, windowMs: number): Promise<{ count: number; resetAt: number }> {
    const now = Date.now();
    const existing = this.#buckets.get(key);
    if (!existing || existing.resetAt <= now) {
      const fresh = { count: 1, resetAt: now + windowMs };
      this.#buckets.set(key, fresh);
      return fresh;
    }
    existing.count += 1;
    return existing;
  }
}
export interface RateLimiterOptions {
  readonly limit: number;
  readonly windowMs: number;
  readonly keyFn?: (ctx: import("@rokke/http").HttpRequestContext) => string;
}
export function rateLimitMiddleware(store: RateLimitStore, options: RateLimiterOptions): import("@rokke/http").Middleware {
  return {
    async handle(ctx, next) {
      const key = options.keyFn?.(ctx) ?? ctx.request.headers.get("X-Forwarded-For") ?? "unknown";
      const { count, resetAt } = await store.increment(key, options.windowMs);
      if (count > options.limit) {
        return ctx.header("Retry-After", String(Math.ceil((resetAt - Date.now()) / 1000)))
          .problem({ type: "about:blank", title: "Too Many Requests", status: 429, instance: "/problems/" });
      }
      return next();
    },
  };
}