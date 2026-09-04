import type { HttpRequestContext } from "./http-request-context";
export interface Middleware {
  handle(ctx: HttpRequestContext, next: () => Promise<Response>): Promise<Response>;
}
/**
 * Compone una lista de Middleware en una sola función Chain of
 * Responsibility — cada uno decide si llama a "next()" (sigue la cadena) o
 * corta devolviendo su propia Response (ej. un Guard que deniega). El orden
 * de ejecución es el orden del array; el último "next()" invoca el handler
 * real de la ruta.
 */
export function composeMiddleware(chain: readonly Middleware[], handler: (ctx: HttpRequestContext) => Promise<Response>): (ctx: HttpRequestContext) => Promise<Response> {
  return (ctx) => {
    let index = -1;
    const dispatch = (i: number): Promise<Response> => {
      if (i <= index) throw new Error("next() llamado más de una vez en el mismo middleware");
      index = i;
      if (i === chain.length) return handler(ctx);
      return chain[i]!.handle(ctx, () => dispatch(i + 1));
    };
    return dispatch(0);
  };
}