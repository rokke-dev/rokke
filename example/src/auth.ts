import type { HttpRequestContext } from "@rokke/http";
import { Jwt } from "@rokke/security";
import securityConfig from "../config/security";

export interface AuthenticatedUser {
  readonly id: number;
  readonly username: string;
}

export const jwt = new Jwt({
  secret: securityConfig.jwt.secret,
  expiresInSeconds: securityConfig.jwt.expiresInSeconds,
});

export async function authenticatedUser(ctx: HttpRequestContext): Promise<AuthenticatedUser | null> {
  const authorization = ctx.request.headers.get("Authorization");
  if (!authorization?.startsWith("Bearer ")) return null;
  const token = authorization.slice("Bearer ".length).trim();
  if (!token) return null;
  try {
    const payload = await jwt.verify(token);
    const id = Number(payload.sub);
    if (!Number.isSafeInteger(id) || id <= 0 || typeof payload.username !== "string") return null;
    return { id, username: payload.username };
  } catch {
    return null;
  }
}
