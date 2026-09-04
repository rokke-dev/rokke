import { describe, expect, test } from "bun:test";
import { InMemoryContainer, type ApplicationContext } from "@rokke/core";
import { Router } from "@rokke/http";
import {
  AuthGuard,
  ForbiddenError,
  Gate,
  InvalidTokenError,
  Jwt,
  Policy,
  SecurityContext,
  SecurityRulesBuilder,
  guardMiddleware,
  secureHeadersMiddleware,
  securityRulesMiddleware,
  type Principal,
} from "../index";

function createApp(): ApplicationContext {
  const container = new InMemoryContainer();
  return {
    basePath: import.meta.dir,
    container,
    state: "ready",
    trackExecutionContext() {},
    untrackExecutionContext() {},
    getBootedProviders: () => [],
  };
}

describe("security HTTP pipeline", () => {
  test("a valid bearer token creates an isolated principal and applies secure headers", async () => {
    const jwt = new Jwt({ secret: "integration-secret" });
    const firstToken = await jwt.sign({ sub: "user-1", roles: ["admin"], authorities: ["records:read"] });
    const secondToken = await jwt.sign({ sub: "user-2", roles: ["reader"], authorities: [] });
    const router = new Router();
    router.use(secureHeadersMiddleware());
    router.use(guardMiddleware(new AuthGuard(jwt)));
    router.register({
      method: "GET",
      path: "/private",
      handler: async (ctx) => {
        const beforeWait = SecurityContext.current().id;
        await Bun.sleep(beforeWait === "user-1" ? 10 : 1);
        return ctx.json({ beforeWait, afterWait: SecurityContext.current().id });
      },
    });
    const handler = router.toBunRoutes(createApp(), [])["/private"]!;

    const [first, second] = await Promise.all([
      handler(new Request("http://localhost/private", { headers: { Authorization: `Bearer ${firstToken}` } })),
      handler(new Request("http://localhost/private", { headers: { Authorization: `Bearer ${secondToken}` } })),
    ]);

    expect(first.status).toBe(200);
    expect(await first.json()).toEqual({ beforeWait: "user-1", afterWait: "user-1" });
    expect(await second.json()).toEqual({ beforeWait: "user-2", afterWait: "user-2" });
    expect(first.headers.get("X-Content-Type-Options")).toBe("nosniff");
    expect(first.headers.get("X-Frame-Options")).toBe("DENY");
    expect(first.headers.get("Strict-Transport-Security")).toContain("max-age=31536000");
  });

  test("a tampered token is rejected by the guard", async () => {
    const jwt = new Jwt({ secret: "integration-secret" });
    const token = await jwt.sign({ sub: "user-1" });
    const [header, body, signature] = token.split(".") as [string, string, string];
    const tamperedSignature = `${signature[0] === "a" ? "b" : "a"}${signature.slice(1)}`;
    const tampered = `${header}.${body}.${tamperedSignature}`;
    await expect(jwt.verify(tampered)).rejects.toBeInstanceOf(InvalidTokenError);

    const router = new Router();
    router.use(guardMiddleware(new AuthGuard(jwt)));
    router.register({ method: "GET", path: "/private", handler: async () => new Response("secret") });
    const response = await router.toBunRoutes(createApp(), [])["/private"]!(new Request("http://localhost/private", {
      headers: { Authorization: `Bearer ${tampered}` },
    }));

    expect(response.status).toBe(401);
  });

  test("authenticated security rules return 401 when no principal was established", async () => {
    const rules = new SecurityRulesBuilder().anyRequest().authenticated().build();
    const router = new Router();
    router.use(securityRulesMiddleware(rules));
    router.register({ method: "GET", path: "/private", handler: async () => new Response("secret") });

    const response = await router.toBunRoutes(createApp(), [])["/private"]!(new Request("http://localhost/private"));
    expect(response.status).toBe(401);
  });

  test("Gate invokes existing policy actions and reports denials", async () => {
    const principal: Principal = {
      id: "user-1",
      roles: [],
      hasRole: () => false,
      hasAuthority: () => false,
    };
    class RecordPolicy extends Policy<{ ownerId: string }> {
      update(user: Principal, record: { ownerId: string }): boolean {
        return user.id === record.ownerId;
      }
    }

    await expect(Gate.authorize(principal, "update", { ownerId: "other" }, new RecordPolicy()))
      .rejects.toEqual(new ForbiddenError("update"));
    await expect(Gate.authorize(principal, "update", { ownerId: "user-1" }, new RecordPolicy()))
      .resolves.toBeUndefined();
  });
});
