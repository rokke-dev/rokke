import { test, expect, describe } from "bun:test";
import { Hash } from "../src/hash";
import { Jwt, InvalidTokenError } from "../src/jwt";
import { Csrf } from "../src/csrf";
import { AuthGuard } from "../src/guards/auth-guard";
import { guardMiddleware } from "../src/guard-middleware";
import { Gate, ForbiddenError, UnknownPolicyActionError, Policy } from "../src/policy";
import { RequiresAuthority } from "../src/requires-authority";
import { SecurityRulesBuilder, AnyRequestNotLastError } from "../src/security-rules";
import { InMemoryRateLimitStore, rateLimitMiddleware } from "../src/rate-limiter";
import { SecurityContext, PrincipalToken } from "../src/security-context";
import { InMemoryContainer } from "@rokke/core";
import { HttpRequestContext } from "@rokke/http";
import type { Principal } from "../src/principal";
describe("Security", () => {
  test("Hash.make() y verify() roundtrip", async () => {
    const hash = await Hash.make("secreto");
    expect(await Hash.verify("secreto", hash)).toBe(true);
    expect(await Hash.verify("mal", hash)).toBe(false);
  });
  test("Jwt.sign() y verify() roundtrip", async () => {
    const jwt = new Jwt({ secret: "test_secret" });
    const token = await jwt.sign({ user: "abc" });
    const claims = await jwt.verify(token);
    expect(claims.user).toBe("abc");
  });
  test("Jwt.verify() expira", async () => {
    const jwt = new Jwt({ secret: "test_secret", expiresInSeconds: -1 });
    const token = await jwt.sign({ user: "abc" });
    await expect(jwt.verify(token)).rejects.toThrow(InvalidTokenError);
  });
  test("Csrf con sessionId distinto falla", () => {
    const csrf = new Csrf({ secret: "s" });
    const t = csrf.generate("s1");
    expect(csrf.verify(t, "s1")).toBe(true);
    expect(csrf.verify(t, "s2")).toBe(false);
  });
  test("SecurityRulesBuilder lanza AnyRequestNotLastError si anyRequest no es último", () => {
    const builder = new SecurityRulesBuilder();
    builder.anyRequest().permitAll();
    expect(() => builder.match("/a").authenticated()).toThrow(AnyRequestNotLastError);
  });
});
