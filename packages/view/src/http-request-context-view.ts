import type { HttpRequestContext } from "@rokke/http";
import { compileTemplate } from "./compiler";
import { renderCompiled } from "./render";
import { getOrCompile } from "./compiled-cache";
declare module "@rokke/http" {
  interface HttpRequestContext {
    view(name: string, data?: Record<string, unknown>): Promise<Response>;
  }
}
export async function viewImpl(this: HttpRequestContext, name: string, data: Record<string, unknown> = {}): Promise<Response> {
  const compiled = await getOrCompile(name, compileTemplate);
  return renderCompiled(compiled, data);
}