import { FileSystem, type FileReference } from "./file-system";
export interface Storage {
  write(path: string, content: ReadableStream<Uint8Array> | ArrayBuffer | string): Promise<void>;
  append(path: string, content: string): Promise<void>;
  read(path: string): FileReference;
  exists(path: string): Promise<boolean>;
  delete(path: string): Promise<void>;
}
export class LocalStorage implements Storage {
  private readonly root: string;
  constructor(root: string) {
    this.root = root;
  }
  async write(path: string, content: ReadableStream<Uint8Array> | ArrayBuffer | string): Promise<void> {
    await Bun.write(this.#resolve(path), content as never);
  }
  async append(path: string, content: string): Promise<void> {
    const fs = await import("node:fs/promises");
    await fs.appendFile(this.#resolve(path), content, "utf-8");
  }
  read(path: string): FileReference {
    return FileSystem.file(this.#resolve(path));
  }
  async exists(path: string): Promise<boolean> {
    return Bun.file(this.#resolve(path)).exists();
  }
  async delete(path: string): Promise<void> {
    await FileSystem.delete(this.#resolve(path));
  }
  #resolve(path: string): string {
    return `${this.root}/${path}`.replace(/\/+/g, "/");
  }
}
