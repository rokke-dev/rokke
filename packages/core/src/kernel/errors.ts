import type { ApplicationState, ServiceProvider } from "../contracts";
export class InvalidStateTransitionError extends Error {
  public readonly from: ApplicationState;
  public readonly attempted: string;
  constructor(from: ApplicationState, attempted: string) {
    super(`Cannot execute "${attempted}" in state "${from}".`);
    this.name = "InvalidStateTransitionError";
    this.from = from;
    this.attempted = attempted;
  }
}
export class BootError extends Error {
  public readonly provider: ServiceProvider;
  public override readonly cause: unknown;
  constructor(provider: ServiceProvider, cause: unknown) {
    super(`boot() of ${provider.constructor.name} failed: ${String(cause)}`);
    this.name = "BootError";
    this.provider = provider;
    this.cause = cause;
  }
}
