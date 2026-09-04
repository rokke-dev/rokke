import type { HttpRequestContext } from "@rokke/http";
export interface Guard {
  handle(ctx: HttpRequestContext): boolean | Promise<boolean>;
}