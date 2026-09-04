import type { Storage } from "@rokke/fs";
import type { LogTransport } from "../log-transport";
import type { LogEntry } from "../log-entry";
export class FileTransport implements LogTransport {
  private readonly storage: Storage;
  private readonly path: string;
  constructor(storage: Storage, path: string) {
    this.storage = storage;
    this.path = path;
  }
  async write(entry: LogEntry): Promise<void> {
    await this.storage.append(this.path, JSON.stringify(entry) + "\n");
  }
}
