import { SecurityContext } from "./security-context";
import { ForbiddenError } from "./policy";
export function RequiresAuthority(authority: string) {
  return function <T, A extends any[], R>(value: (this: T, ...args: A) => R, context: ClassMethodDecoratorContext<T, (this: T, ...args: A) => R>) {
    return async function (this: T, ...args: A): Promise<any> {
      const principal = SecurityContext.current();
      if (!principal.hasAuthority(authority)) throw new ForbiddenError(authority);
      return await (value as any).apply(this, args);
    } as unknown as (this: T, ...args: A) => R;
  };
}