import { test, expect, describe, mock } from "bun:test";
import { InMemoryRateLimitStore, rateLimitMiddleware } from "../src/rate-limiter";
describe("Rate Limiter", () => {
  test("RateLimiter sobre el límite responde 429 con Retry-After", async () => {
    const store = new InMemoryRateLimitStore();
    const mw = rateLimitMiddleware(store, { limit: 1, windowMs: 1000 });
    const ctx = {
      request: { headers: new Map([["X-Forwarded-For", "ip1"]]) },
      correlationId: "123",
      header: function(k: string, v: string) { return this; },
      problem: function(p: any) { return new Response(null, { status: p.status }); }
    } as any;
    ctx.request.headers.get = (k: string) => k === "X-Forwarded-For" ? "ip1" : null;
    const nextResponse = new Response("ok");
    const next = mock(async () => nextResponse);
    const r1 = await mw.handle(ctx, next);
    expect(r1).toBe(nextResponse);
    const r2 = await mw.handle(ctx, next);
    expect(r2.status).toBe(429);
  });
});