import type { Logger } from "@rokke/logger";
export function handleMidStreamError(error: Error, ctx: import("@rokke/http").HttpRequestContext, controller: ReadableStreamDefaultController): void {
  const loggerToken = {} as any; 
  try {
    const logger = ctx.container.get(loggerToken) as Logger;
    logger.error("Excepción a mitad de un stream de vista — conexión truncada", { correlationId: ctx.correlationId, error });
  } catch {}
  controller.error(error);
}