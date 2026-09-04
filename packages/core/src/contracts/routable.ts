// @ts-ignore
import type { ExecutionContext } from "./execution-context";

export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE" | "HEAD" | "OPTIONS";
export interface RouteDefinition<TContext extends ExecutionContext = ExecutionContext> {
  readonly method: HttpMethod;
  readonly path: string;
  readonly handler: (ctx: TContext) => Promise<Response>;
}
export interface Routable<TContext extends ExecutionContext = ExecutionContext> {
  routes(): RouteDefinition<TContext>[];
}
