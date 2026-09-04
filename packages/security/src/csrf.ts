export interface CsrfOptions {
  readonly secret: string;
}
export class Csrf {
  private readonly options: CsrfOptions;
  constructor(options: CsrfOptions) { this.options = options; }
  generate(sessionId: string, expiresInMs = 3_600_000): string {
    return Bun.CSRF.generate(this.options.secret, { sessionId, expiresIn: expiresInMs });
  }
  verify(token: string, sessionId: string): boolean {
    return Bun.CSRF.verify(token, { secret: this.options.secret, sessionId });
  }
}