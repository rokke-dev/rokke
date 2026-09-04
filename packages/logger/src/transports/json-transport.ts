import type { LogTransport } from "../log-transport";
import type { LogEntry } from "../log-entry";
export class JsonTransport implements LogTransport {
  private readonly sink: (line: string) => void;
  constructor(sink: (line: string) => void = console.log) {
    this.sink = sink;
  }
  write(entry: LogEntry): void {
    this.sink(JSON.stringify(entry));
  }
}
