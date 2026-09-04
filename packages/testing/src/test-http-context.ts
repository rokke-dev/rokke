import { HttpRequestContext } from "@rokke/http";
import { createTestApplicationContext, type TestBinding } from "./test-application-context";

export interface TestHttpContextOptions {
  readonly method?: string;
  readonly path?: string;
  readonly headers?: Record<string, string>;
  readonly params?: Record<string, string>;
  readonly bindings?: readonly TestBinding<unknown>[];
}

export function createTestHttpContext(options: TestHttpContextOptions = {}): HttpRequestContext {
  const app = createTestApplicationContext(options.bindings);
  const request = new Request(`http://localhost${options.path ?? "/"}`, {
    method: options.method ?? "GET",
    headers: options.headers,
  });
  return new HttpRequestContext(app, request, options.params ?? {});
}
