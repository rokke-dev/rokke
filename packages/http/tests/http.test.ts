import { test, expect, describe } from "bun:test";
import { RouteTable, Router, DuplicateRouteError, HttpRequestContext, HeaderInjectionError, SerializationError, HttpProvider, DebugInProductionError } from "../src";
import { InMemoryContainer, type ApplicationContext } from "@rokke/core";
import { ConfigToken } from "@rokke/config";

describe("RouteTable / Router", () => {
  test("GET responds normally", async () => {
    const router = new Router();
    router.register({ method: "GET", path: "/test", handler: async () => new Response("ok") });
    const app = { trackExecutionContext: () => {}, untrackExecutionContext: () => {}, container: { createScope: () => ({}) } } as unknown as ApplicationContext;
    const routes = router.toBunRoutes(app, []);
    const reqGet = new Request("http://localhost/test");
    const resGet = await routes["/test"]!(reqGet);
    expect(await resGet.text()).toBe("ok");
  });
});

describe("HttpRequestContext", () => {
  const getCtx = () => {
    const app = { trackExecutionContext: () => {}, container: { createScope: () => ({}) } } as unknown as ApplicationContext;
    return new HttpRequestContext(app, new Request("http://localhost/test"), {});
  };
  test("json serialization", () => {
    const ctx = getCtx();
    const res = ctx.json({ a: 1 });
    expect(res.headers.get("Content-Type")).toBe("application/json; charset=utf-8");
  });
});