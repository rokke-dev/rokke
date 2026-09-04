export interface RequestProfile {
  readonly correlationId: string;
  readonly route: { pattern: string; controller: string; method: string };
  readonly timings: { middleware: Array<{ name: string; ms: number }>; total: number };
  readonly queries: Array<{ sql: string; params: readonly unknown[]; ms: number }>;
  readonly viewRender?: { name: string; ms: number };
}
