import type { Principal } from "./principal";
import { PrincipalToken } from "./security-context";
import { UnboundTokenError } from "@rokke/core";
interface Matcher {
  readonly pattern: string;
  readonly rule: "permitAll" | "authenticated" | { hasRole: string };
}
export class SecurityRulesBuilder {
  readonly #matchers: Matcher[] = [];
  #anyRequestSet = false;
  match(pattern: string): { permitAll: () => SecurityRulesBuilder; authenticated: () => SecurityRulesBuilder; hasRole: (role: string) => SecurityRulesBuilder } {
    return {
      permitAll: () => { this.#push(pattern, "permitAll"); return this; },
      authenticated: () => { this.#push(pattern, "authenticated"); return this; },
      hasRole: (role) => { this.#push(pattern, { hasRole: role }); return this; },
    };
  }
  anyRequest(): { authenticated: () => SecurityRulesBuilder; permitAll: () => SecurityRulesBuilder } {
    return {
      authenticated: () => { this.#push("**", "authenticated"); this.#anyRequestSet = true; return this; },
      permitAll: () => { this.#push("**", "permitAll"); this.#anyRequestSet = true; return this; },
    };
  }
  build(): readonly Matcher[] {
    const lastIsAnyRequest = this.#matchers[this.#matchers.length - 1]?.pattern === "**";
    if (this.#anyRequestSet && !lastIsAnyRequest) throw new AnyRequestNotLastError();
    return this.#matchers;
  }
  #push(pattern: string, rule: Matcher["rule"]): void {
    if (this.#anyRequestSet) throw new AnyRequestNotLastError();
    this.#matchers.push({ pattern, rule });
  }
}
export class AnyRequestNotLastError extends Error {
  constructor() {
    super('anyRequest() debe ser el último matcher declarado — una regla después de él nunca se evaluaría.');
    this.name = "AnyRequestNotLastError";
  }
}
function matchesPattern(pattern: string, path: string): boolean {
  if (pattern === "**") return true;
  if (pattern.endsWith("/**")) return path.startsWith(pattern.slice(0, -3)) || path === pattern.slice(0, -3);
  return path === pattern;
}
export function securityRulesMiddleware(matchers: readonly Matcher[]): import("@rokke/http").Middleware {
  return {
    async handle(ctx, next) {
      const path = new URL(ctx.request.url).pathname;
      const matched = matchers.find((m) => matchesPattern(m.pattern, path));
      if (!matched || matched.rule === "permitAll") return next();
      let principal: Principal | undefined;
      try {
        principal = ctx.container.get(PrincipalToken as never) as Principal;
      } catch (error) {
        if (!(error instanceof UnboundTokenError)) throw error;
      }
      if (matched.rule === "authenticated" && !principal) {
        return ctx.problem({ type: "about:blank", title: "Unauthorized", status: 401, instance: "/problems/" });
      }
      if (typeof matched.rule === "object" && !principal?.hasRole(matched.rule.hasRole)) {
        return ctx.problem({ type: "about:blank", title: "Forbidden", status: 403, instance: "/problems/" });
      }
      return next();
    },
  };
}
