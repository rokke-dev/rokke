import { expect, test, describe } from "bun:test";
import { Schema, wrapAsUploadedFile } from "../src";
describe("validation expansion", () => {
  test("Schema.number().positive() lanza si es <= 0", () => {
    const s = Schema.number().positive();
    expect(() => s.parse(-1)).toThrow("Validación falló: : debe ser un número positivo");
    expect(s.parse(5)).toBe(5);
  });
  test("Schema.string().email() lanza si no es email", () => {
    const s = Schema.string().email();
    expect(() => s.parse("no-es-un-email")).toThrow("Validación falló: : debe ser un email válido");
    expect(s.parse("a@b.com")).toBe("a@b.com");
  });

  test("string refinements and safeParse cover success and failure", () => {
    const schema = Schema.string().uuid().minLength(36);
    expect(schema.safeParse("550e8400-e29b-41d4-a716-446655440000")).toEqual({
      success: true,
      data: "550e8400-e29b-41d4-a716-446655440000",
    });
    expect(schema.safeParse("short").success).toBe(false);
  });

  test("number min and safeParse cover success and failure", () => {
    const schema = Schema.number().min(10);
    expect(schema.safeParse(10)).toEqual({ success: true, data: 10 });
    expect(schema.safeParse(9).success).toBe(false);
    expect(schema.safeParse(Number.NaN).success).toBe(false);
  });

  test("boolean and optional safeParse preserve their contracts", () => {
    expect(Schema.boolean().safeParse(true)).toEqual({ success: true, data: true });
    expect(Schema.boolean().safeParse("true").success).toBe(false);
    const optional = Schema.optional(Schema.string());
    expect(optional.safeParse(undefined)).toEqual({ success: true, data: undefined });
    expect(optional.safeParse("value")).toEqual({ success: true, data: "value" });
    expect(optional.safeParse(1).success).toBe(false);
  });

  test("file schema validates MIME and uploaded files can stream and save", async () => {
    const file = new File(["content"], "note.txt", { type: "text/plain" });
    const uploaded = wrapAsUploadedFile(file);
    expect(Schema.file({ accept: [uploaded.mimeType] }).safeParse(uploaded).success).toBe(true);
    expect(Schema.file({ accept: ["image/png"] }).safeParse(uploaded).success).toBe(false);
    expect(Schema.file().safeParse({ filename: "missing-stream" }).success).toBe(false);

    expect(await new Response(uploaded.stream()).text()).toBe("content");
    let savedPath = "";
    let savedBody = "";
    await uploaded.saveTo({
      async write(path, data) {
        savedPath = path;
        savedBody = await new Response(data).text();
      },
      read(path) {
        return {
          path,
          size: 0,
          type: "application/octet-stream",
          text: async () => "",
          arrayBuffer: async () => new ArrayBuffer(0),
          stream: () => new ReadableStream<Uint8Array>(),
        };
      },
      async exists() { return false; },
      async delete() {},
      async append() {},
    }, "uploads/note.txt");
    expect({ savedPath, savedBody }).toEqual({ savedPath: "uploads/note.txt", savedBody: "content" });
  });
});
