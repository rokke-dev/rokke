import { test, expect, describe, mock } from "bun:test";
import { renderCompiled } from "../src/render";
import { handleMidStreamError } from "../src/mid-stream-error";
import { renderDebugPage } from "../src/debug-page";
describe("View", () => {
  test("{{ }} escapa HTML por defecto", async () => {
    const compiledHtml = "<div>{{ user.name }}</div>";
    const data = { user: { name: "<script>alert(1)</script>" } };
    const response = renderCompiled(compiledHtml, data);
    const result = await response.text();
    expect(result).toBe("<div>&lt;script&gt;alert(1)&lt;/script&gt;</div>");
  });
  test("handler sintético que lanza a mitad de un stream de vista trunca la conexión", () => {
    let errorCalled = false;
    const controller = { error: (e: any) => { errorCalled = true; } } as any;
    const ctx = { container: { get: () => ({ error: () => {} }) }, correlationId: "123" } as any;
    handleMidStreamError(new Error("fail"), ctx, controller);
    expect(errorCalled).toBe(true);
  });
  test("la página de depuración usa el mismo correlationId", async () => {
    let passedData: any;
    const ctx = {
      correlationId: "corr-123",
      view: async (name: string, data: any) => {
        passedData = data;
        return new Response("ok");
      }
    } as any;
    await renderDebugPage(new Error("boom"), ctx);
    expect(passedData.correlationId).toBe("corr-123");
  });
  test("ctx.view() funciona sin que @rokke/http importe @rokke/view", async () => {
    const { HttpRequestContext } = await import("@rokke/http");
    const { viewImpl } = await import("../src/http-request-context-view");
    const originalView = HttpRequestContext.prototype.view;
    try {
      HttpRequestContext.prototype.view = viewImpl;
      const ctx = Object.create(HttpRequestContext.prototype);
      const resp = await ctx.view("test");
      expect(resp.status).toBe(200);
    } finally {
      HttpRequestContext.prototype.view = originalView;
    }
  });
});
