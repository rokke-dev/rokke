import { currentExecutionContext, NoActiveExecutionContextError } from "@rokke/core";
import type { Logger } from "./logger";
import type { LogTransport } from "./log-transport";
import type { LogEntry, LogLevel } from "./log-entry";
import { LEVEL_ORDER } from "./log-entry";
export class FrameworkLogger implements Logger {
  private readonly transports: readonly LogTransport[];
  private readonly channelName: string;
  private readonly minLevel: LogLevel;
  constructor(
    transports: readonly LogTransport[],
    channelName: string = "default",
    minLevel: LogLevel = "debug",
  ) {
    this.transports = transports;
    this.channelName = channelName;
    this.minLevel = minLevel;
  }
  debug(message: string, meta?: Record<string, unknown>): void { this.#log("debug", message, meta); }
  info(message: string, meta?: Record<string, unknown>): void { this.#log("info", message, meta); }
  warn(message: string, meta?: Record<string, unknown>): void { this.#log("warn", message, meta); }
  error(message: string, meta?: Record<string, unknown>): void { this.#log("error", message, meta); }
  critical(message: string, meta?: Record<string, unknown>): void { this.#log("critical", message, meta); }
  channel(name: string): Logger {
    return new FrameworkLogger(this.transports, name, this.minLevel);
  }
  #log(level: LogLevel, message: string, meta?: Record<string, unknown>): void {
    if (LEVEL_ORDER[level] < LEVEL_ORDER[this.minLevel]) return;
    const correlationId = this.#tryGetCorrelationId();
    const entry: LogEntry = {
      level,
      message,
      channel: this.channelName,
      timestamp: new Date().toISOString(),
      ...(meta !== undefined ? { meta } : {}),
      ...(correlationId !== undefined ? { correlationId } : {}),
    };
    for (const transport of this.transports) void transport.write(entry);
  }
  #tryGetCorrelationId(): string | undefined {
    try {
      return currentExecutionContext().correlationId;
    } catch (error) {
      if (error instanceof NoActiveExecutionContextError) return undefined;
      throw error;
    }
  }
}
