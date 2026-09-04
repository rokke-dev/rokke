import type { LogEntry } from "./log-entry";
export interface LogTransport {
  write(entry: LogEntry): void | Promise<void>;
}
