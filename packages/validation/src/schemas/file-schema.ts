import type { Schema } from "../schema";
import { ValidationException } from "../schema";
import type { UploadedFile } from "../uploaded-file";
export interface FileSchemaOptions {
  readonly maxSizeBytes?: number;
  readonly accept?: readonly string[]; 
}
export class FileSchema implements Schema<UploadedFile> {
  private readonly options: FileSchemaOptions;
  constructor(options: FileSchemaOptions) {
    this.options = options;
  }
  parse(input: unknown): UploadedFile {
    if (!isUploadedFile(input)) throw new ValidationException([{ path: "", message: "se esperaba un archivo" }]);
    if (this.options.maxSizeBytes !== undefined && input.size > this.options.maxSizeBytes) {
      throw new ValidationException([{ path: "", message: `el archivo excede el tamaño máximo de ${this.options.maxSizeBytes} bytes` }]);
    }
    if (this.options.accept && !this.options.accept.includes(input.mimeType)) {
      throw new ValidationException([{ path: "", message: `tipo de archivo no permitido: ${input.mimeType}` }]);
    }
    return input;
  }
  safeParse(input: unknown) {
    try { return { success: true as const, data: this.parse(input) }; }
    catch (e) { return { success: false as const, errors: (e as ValidationException).issues }; }
  }
}
function isUploadedFile(value: unknown): value is UploadedFile {
  return typeof value === "object" && value !== null && "filename" in value && "stream" in value;
}
