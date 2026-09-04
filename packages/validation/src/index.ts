import { StringSchema } from "./schemas/string-schema";
import { NumberSchema } from "./schemas/number-schema";
import { BooleanSchema } from "./schemas/boolean-schema";
import { ObjectSchema } from "./schemas/object-schema";
import { OptionalSchema } from "./schemas/optional-schema";
import { FileSchema, type FileSchemaOptions } from "./schemas/file-schema";
import type { Schema as ISchema } from "./schema";
export type { ValidationIssue } from "./schema";
export type Schema<T> = ISchema<T>;
export { ValidationException } from "./schema";
export * from "./uploaded-file";
export * from "./schemas/string-schema";
export * from "./schemas/number-schema";
export * from "./schemas/boolean-schema";
export * from "./schemas/object-schema";
export * from "./schemas/optional-schema";
export * from "./schemas/file-schema";
export const Schema = {
  string: () => new StringSchema(),
  number: () => new NumberSchema(),
  boolean: () => new BooleanSchema(),
  object: <T extends Record<string, unknown>>(shape: { [K in keyof T]: ISchema<T[K]> }) => new ObjectSchema<T>(shape),
  file: (options: FileSchemaOptions = {}) => new FileSchema(options),
  optional: <T>(inner: ISchema<T>) => new OptionalSchema(inner),
};
