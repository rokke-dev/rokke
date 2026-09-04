import { ConfigToken, type AppConfig } from "@rokke/config";
import { LoggerToken } from "@rokke/logger";
import type { HttpRequestContext } from "./http-request-context";
import type { ExceptionHandler } from "./exception-handler";
import type { ProblemDetails } from "./problem-details";
import { renderDebugPage, renderGenericErrorPage } from "./debug-page";
export async function resolveException(
  error: unknown,
  ctx: HttpRequestContext,
  handlers: readonly ExceptionHandler[],
): Promise<Response> {
  const err = error instanceof Error ? error : new Error(String(error));
  const config = ctx.container.get(ConfigToken);
  const logger = ctx.container.get(LoggerToken);
  logger.error(`Excepción no controlada en ${ctx.request.method} ${ctx.request.url}`, { correlationId: ctx.correlationId, stack: err.stack });
  const matched = handlers.find((h) => h.supports(err));
  const problem = matched ? matched.handle(err, ctx) : buildUnhandledProblem(err, ctx, config);
  if (wantsHtml(ctx.request)) {
    return config.app.debug ? renderDebugPage(err, ctx) : renderGenericErrorPage(ctx.correlationId);
  }
  return ctx.problem(problem);
}
function buildUnhandledProblem(error: Error, ctx: HttpRequestContext, config: AppConfig): ProblemDetails {
  if (config.app.debug) {
    return {
      type: "about:blank",
      title: error.name || "Internal Server Error",
      status: 500,
      detail: error.message,
      instance: `/problems/${ctx.correlationId}`,
      stack: error.stack,
    };
  }
  return { type: "about:blank", title: "Internal Server Error", status: 500, instance: `/problems/${ctx.correlationId}` };
}
function wantsHtml(request: Request): boolean {
  const accept = request.headers.get("Accept") ?? "";
  return accept.includes("text/html") && !accept.includes("application/json");
}
