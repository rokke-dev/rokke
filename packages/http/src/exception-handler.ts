import type { HttpRequestContext } from "./http-request-context";
import type { ProblemDetails } from "./problem-details";
export abstract class ExceptionHandler<E extends Error = Error> {
  abstract supports(error: Error): error is E;
  abstract handle(error: E, ctx: HttpRequestContext): ProblemDetails;
}
