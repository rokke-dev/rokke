export interface AppConfig {
  readonly app: {
    readonly name: string;
    readonly env: "development" | "staging" | "production";
    readonly debug: boolean;
  };
  readonly [namespace: string]: unknown;
}
