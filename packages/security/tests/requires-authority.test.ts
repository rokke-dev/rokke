import { test, expect, describe } from "bun:test";
import { RequiresAuthority } from "../src/requires-authority";
import { ForbiddenError } from "../src/policy";
import { SecurityContext, PrincipalToken } from "../src/security-context";
import { InMemoryContainer } from "@rokke/core";
import type { Principal } from "../src/principal";
import * as core from "@rokke/core";
describe("@RequiresAuthority", () => {
  test("throws ForbiddenError if principal lacks authority", async () => {
    class Controller {
      @RequiresAuthority("admin")
      async doSomething() { return "ok"; }
    }
    const principal: Principal = {
      id: "1", roles: [],
      hasRole: () => false,
      hasAuthority: (a) => false
    };
    const container = new InMemoryContainer();
    container.bind(PrincipalToken, () => principal, "scoped");
    const mockCtx = { container } as any;
    await core.runInExecutionContext(mockCtx, async () => {
      const c = new Controller();
      await expect(c.doSomething()).rejects.toThrow(ForbiddenError);
    });
  });
});
