import type { HttpRequestContext } from "@rokke/http";
import { Jwt } from "../jwt";
import { PrincipalToken } from "../security-context";
import type { Principal } from "../principal";
import type { Guard } from "../guard";
export class AuthGuard implements Guard {
  private readonly jwt: Jwt;
  constructor(jwt: Jwt) { this.jwt = jwt; }
  async handle(ctx: HttpRequestContext): Promise<boolean> {
    const header = ctx.request.headers.get("Authorization");
    if (!header?.startsWith("Bearer ")) return false;
    try {
      const claims = await this.jwt.verify(header.slice(7));
      const principal = this.#toPrincipal(claims);
      ctx.container.bind(PrincipalToken, () => principal, "scoped");
      return true;
    } catch {
      return false;
    }
  }
  #toPrincipal(claims: Record<string, unknown>): Principal {
    const roles = (claims.roles as string[]) ?? [];
    return {
      id: String(claims.sub),
      roles,
      hasRole: (role) => roles.includes(role),
      hasAuthority: (authority) => (claims.authorities as string[] ?? []).includes(authority),
    };
  }
}