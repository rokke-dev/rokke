import type { Storage } from "@rokke/fs";
export interface UploadedFile {
  readonly filename: string;
  readonly mimeType: string;
  readonly size: number;
  stream(): ReadableStream<Uint8Array>;
  saveTo(storage: Storage, path: string): Promise<void>;
}
export function wrapAsUploadedFile(file: File): UploadedFile {
  return {
    filename: file.name,
    mimeType: file.type,
    size: file.size,
    stream: () => file.stream(),
    async saveTo(storage: Storage, path: string): Promise<void> {
      await storage.write(path, file.stream());
    },
  };
}
