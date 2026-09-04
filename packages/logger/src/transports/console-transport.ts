import type { LogTransport } from "../log-transport";
import type { LogEntry } from "../log-entry";
export class ConsoleTransport implements LogTransport {
  write(entry: LogEntry): void {
    const prefix = `[${entry.timestamp}] ${entry.level.toUpperCase()} (${entry.channel})`;
    const suffix = entry.correlationId ? ` [${entry.correlationId}]` : "";
    const line = `${prefix}${suffix}: ${entry.message}`;
    const sink = entry.level === "error" || entry.level === "critical" ? console.error : console.log;
    if (entry.meta) sink(line, entry.meta);
    else sink(line);
  }
}
