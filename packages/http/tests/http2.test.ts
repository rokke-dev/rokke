import { test, expect, describe } from "bun:test";
import { HttpRequestContext } from "../src";
import type { ApplicationContext } from "@rokke/core";
import { ConfigToken } from "@rokke/config";

const mockApp = { trackExecutionContext: () => {}, untrackExecutionContext: () => {}, container: { createScope: function() { return this; }, get: (t: any) => t === ConfigToken ? { app: { debug: true, env: "test" } } : { error: () => {} } } } as unknown as ApplicationContext;

describe("HttpRequestContext - helpers", () => {
  const ctx = new HttpRequestContext(mockApp, new Request("http://localhost/test"), {});
  test("ctx.json() produces Content-Type application/json; charset=utf-8", () => {
    const res = ctx.json({a:1});
    expect(res.headers.get("Content-Type")).toBe("application/json; charset=utf-8");
  });
});