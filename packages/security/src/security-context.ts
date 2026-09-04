import { currentExecutionContext, type Container, token } from "@rokke/core";
import type { Principal } from "./principal";
export const PrincipalToken = token<Principal>("Principal");
export const SecurityContext = {
  current(): Principal {
    const ctx = currentExecutionContext();
    return (ctx.container as Container).get(PrincipalToken);
  },
};