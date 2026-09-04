export type LogLevel = "debug" | "info" | "warn" | "error" | "critical";
export interface LogEntry {
  readonly level: LogLevel;
  readonly message: string;
  readonly meta?: Record<string, unknown>;
  readonly timestamp: string;
  readonly correlationId?: string;
  readonly channel: string;
}
export const LEVEL_ORDER: Record<LogLevel, number> = { debug: 0, info: 1, warn: 2, error: 3, critical: 4 };
