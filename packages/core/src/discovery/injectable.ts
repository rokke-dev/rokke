import type { Container, Lifecycle, Token } from "../contracts";
(globalThis as any).Symbol.metadata ??= Symbol.for("Symbol.metadata");
interface InjectableMetadata {
  injectable?: boolean;
}
export function Injectable() {
  return function <T extends new (...args: any[]) => object>(_target: T, context: ClassDecoratorContext<T>): void {
    const meta = context.metadata as InjectableMetadata;
    meta.injectable = true;
  };
}
export function isInjectable(ctor: Function): boolean {
  const metadata = (ctor as { [Symbol.metadata]?: InjectableMetadata })[Symbol.metadata];
  return metadata?.injectable === true;
}
export interface InjectableClass<T> {
  new (...args: any[]): T;
  readonly inject?: readonly Token<unknown>[];
}
export function bindInjectable<T>(container: Container, tok: Token<T>, ctor: InjectableClass<T>, lifecycle: Lifecycle = "singleton"): void {
  if (!isInjectable(ctor)) throw new NotInjectableError(ctor.name);
  container.bind(tok, (c) => {
    const deps = (ctor.inject ?? []).map((depToken) => c.get(depToken));
    return new ctor(...deps);
  }, lifecycle);
}
export class NotInjectableError extends Error {
  readonly className: string;
  constructor(className: string) {
    super("\"" + className + "\" no est decorada con @Injectable() - no se puede auto-construir.");
    this.className = className;
    this.name = "NotInjectableError";
  }
}