/**
 * Unique and typed identifier for a Container binding.
 *
 * It is a real `symbol` — two tokens never collide, even if
 * created with the same `description` — with a ghost field `__type` that
 * NEVER exists at runtime (it is not read, written, or takes memory beyond
 * the type signature). Its only purpose is to give TypeScript something
 * to pull from to infer `T` in `container.get<T>(myToken)` without the
 * developer having to repeat the type manually in each `get()`.
 */
export type Token<T> = symbol & { readonly __type?: T };
/**
 * Creates a new Token.
 *
 * @param description Text ONLY for debugging — appears in `String(token)`
 *   and inside the messages of `UnboundTokenError` and `CircularDependencyError`.
 *   DOES NOT participate in equality of two tokens: `token<User>("X")` called twice
 *   produces two DISTINCT and incompatible tokens, by design.
 *
 * @remarks Rule T-1: A Token is declared ONLY ONCE, at module level,
 *   next to the domain contract it represents (e.g., `UserRepositoryToken`
 *   lives in the same file as the `UserRepository` interface, not in the consumer).
 *   Never call `token()` inside a function or method — that would create a new token,
 *   and therefore a broken binding, every time that function runs.
 */
export function token<T>(description: string): Token<T> {
  return Symbol(description) as Token<T>;
}