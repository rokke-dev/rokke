import type { ApplicationContext } from "@rokke/core";
import type { HttpRequestContext } from "./http-request-context";
export async function finalizeResponse(response: Response, ctx: HttpRequestContext, app: ApplicationContext): Promise<Response> {
  if (!response.body) {
    await disposeContext(ctx, app);
    return response;
  }
  const [monitored, passthrough] = response.body.tee();
  void drainAndDispose(monitored, ctx, app);
  return new Response(passthrough, response);
}
async function drainAndDispose(stream: ReadableStream<Uint8Array>, ctx: HttpRequestContext, app: ApplicationContext): Promise<void> {
  const reader = stream.getReader();
  try {
    // eslint-disable-next-line no-constant-condition
    while (true) {
      const { done } = await reader.read();
      if (done) break;
    }
  } catch {
  } finally {
    await disposeContext(ctx, app);
  }
}
async function disposeContext(ctx: HttpRequestContext, app: ApplicationContext): Promise<void> {
  await ctx[Symbol.asyncDispose]();
  app.untrackExecutionContext(ctx);
}
