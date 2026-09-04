import { expect, test, describe } from "bun:test";
import { createTestHttpContext } from "../src/test-http-context";
import { HttpTestClient } from "../src/http-test-client";
import { Router } from "@rokke/http";
describe("Testing", () => {
  test("createTestHttpContext() produce un HttpRequestContext funcional sin Bun.serve", async () => {
    const ctx = createTestHttpContext({
      method: "POST",
      path: "/users?foo=bar",
      headers: { "Content-Type": "application/json" },
      params: { id: "123" }
    });
    expect(ctx.request.method).toBe("POST");
    expect(ctx.params.id).toBe("123");
    expect(new URL(ctx.request.url).searchParams.get("foo")).toBe("bar");
    expect(ctx.request.headers.get("Content-Type")).toBe("application/json");
  });
  test("HttpTestClient resuelve parámetros en rutas dinámicas", async () => {
    const router = new Router();
    router.register({
      method: "GET",
      path: "/users/:id",
      handler: async (ctx) => ctx.json({ id: ctx.params.id })
    });
    const app: any = { container: { createScope: () => ({ get: () => ({}) }) }, trackExecutionContext: () => {}, untrackExecutionContext: () => {} };
    const client = new HttpTestClient(router, app);
    const response = await client.request("GET", "/users/42");
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ id: "42" });
    await client.close();
  });
  test("Dos HttpTestClient instancian puertos distintos", async () => {
    const router = new Router();
    const app: any = {};
    const client1 = new HttpTestClient(router, app);
    const client2 = new HttpTestClient(router, app);
    const url1 = await client1.request("GET", "/").then(r => r.url);
    const url2 = await client2.request("GET", "/").then(r => r.url);
    expect(url1).not.toBe(url2);
    await client1.close();
    await client2.close();
  });
});
