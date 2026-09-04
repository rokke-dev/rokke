export interface FileReference {
  readonly path: string;
  readonly size: number;
  readonly type: string;
  text(): Promise<string>;
  arrayBuffer(): Promise<ArrayBuffer>;
  stream(): ReadableStream<Uint8Array>;
}
export const FileSystem = {
  file(path: string): FileReference {
    return Bun.file(path) as unknown as FileReference;
  },
  async write(path: string, content: string | ArrayBuffer | Blob): Promise<void> {
    await Bun.write(path, content);
  },
  async exists(path: string): Promise<boolean> {
    return Bun.file(path).exists();
  },
  async delete(path: string): Promise<void> {
    const fs = await import("node:fs/promises");
    await fs.unlink(path);
  },
  dirname(path: string): string {
    const p = require("node:path");
    return p.dirname(path);
  }
};
