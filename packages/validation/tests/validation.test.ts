import { test, expect } from "bun:test";
import { Schema, ValidationException, wrapAsUploadedFile } from "../src";
test("Schema.string", () => {
  const schema = Schema.string();
  expect(schema.parse("test")).toBe("test");
  expect(() => schema.parse(123)).toThrow(ValidationException);
});
test("Schema.number", () => {
  const schema = Schema.number();
  expect(schema.parse(123)).toBe(123);
  expect(() => schema.parse("test")).toThrow(ValidationException);
});
test("Schema.boolean", () => {
  const schema = Schema.boolean();
  expect(schema.parse(true)).toBe(true);
  expect(() => schema.parse("test")).toThrow(ValidationException);
});
test("Schema.object accumulates errors", () => {
  const schema = Schema.object({
    a: Schema.string(),
    b: Schema.number()
  });
  try {
    schema.parse({ a: 123, b: "test" });
    expect(true).toBe(false);
  } catch (e: any) {
    expect(e.issues.length).toBe(2);
    expect(e.issues[0].path).toBe("a");
    expect(e.issues[1].path).toBe("b");
  }
});
test("Schema.file rejects over max size", () => {
  const schema = Schema.file({ maxSizeBytes: 10 });
  const file = new File(["12345678901"], "test.txt", { type: "text/plain" });
  const wrapped = wrapAsUploadedFile(file);
  expect(() => schema.parse(wrapped)).toThrow(ValidationException);
  const validFile = new File(["123"], "test.txt", { type: "text/plain" });
  const validWrapped = wrapAsUploadedFile(validFile);
  expect(schema.parse(validWrapped)).toBe(validWrapped);
});
