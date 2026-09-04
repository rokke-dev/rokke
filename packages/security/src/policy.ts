import type { Principal } from "./principal";
export abstract class Policy<T> {}
export const Gate = {
  async authorize<T>(principal: Principal, action: string, resource: T, policy: Policy<T>): Promise<void> {
    const check = (policy as unknown as Record<string, (p: Principal, r: T) => boolean | Promise<boolean>>)[action];
    if (!check) throw new UnknownPolicyActionError(action);
    const allowed = await check(principal, resource);
    if (!allowed) throw new ForbiddenError(action);
  },
};
export class ForbiddenError extends Error {
  public readonly action: string;
  constructor(action: string) {
    super(`No autorizado para "${action}".`);
    this.name = "ForbiddenError";
    this.action = action;
  }
}
export class UnknownPolicyActionError extends Error {
  public readonly action: string;
  constructor(action: string) {
    super("La policy no define una acción \"${action}\".");
    this.name = "UnknownPolicyActionError";
    this.action = action;
  }
}
