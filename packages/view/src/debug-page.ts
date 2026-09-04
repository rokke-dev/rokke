export async function renderDebugPage(error: Error, ctx: import("@rokke/http").HttpRequestContext): Promise<Response> {
  return ctx.view("__rokke/debug", {
    errorName: error.name,
    errorMessage: error.message,
    stack: error.stack,
    correlationId: ctx.correlationId,
  });
}