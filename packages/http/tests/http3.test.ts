import { test, expect, describe, beforeEach, afterEach } from "bun:test";
import { Router, HttpProvider, HttpRequestContext } from "../src";
import { InMemoryContainer } from "@rokke/core";
import { ConfigToken } from "@rokke/config";

describe("Router 2", () => {
  const mockApp = { trackExecutionContext: () => {}, untrackExecutionContext: () => {}, container: { createScope: function() { return this; }, get: (t: any) => t === ConfigToken ? { app: { debug: true, env: "test" } } : { error: () => {} } } } as any;
  test("HEAD over GET returns headers without body", async () => {
    const router = new Router();
    router.register({ method: "GET", path: "/test", handler: async () => new Response("ok", { headers: { "X-Test": "1" } }) });
    const routes = router.toBunRoutes(mockApp, []);
    const req = new Request("http://localhost/test", { method: "HEAD" });
    const res = await routes["/test"]!(req);
    expect(res.status).toBe(200);
  });
});