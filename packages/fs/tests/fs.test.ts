import { expect, test, describe, beforeAll, afterAll } from "bun:test";
import { FileSystem, Glob, LocalStorage } from "../src";
const tmpDir = `${import.meta.dir}/tmp_fs`;
beforeAll(async () => {
  await import("node:fs/promises").then(fs => fs.mkdir(tmpDir, { recursive: true }));
});
afterAll(async () => {
  await import("node:fs/promises").then(fs => fs.rm(tmpDir, { recursive: true, force: true }));
});
describe("FileSystem", () => {
  test("write() and file().text() make correct roundtrip", async () => {
    const path = `${tmpDir}/test-file.txt`;
    await FileSystem.write(path, "hello world");
    expect(await FileSystem.exists(path)).toBe(true);
    const content = await FileSystem.file(path).text();
    expect(content).toBe("hello world");
    await FileSystem.delete(path);
    expect(await FileSystem.exists(path)).toBe(false);
  });
});
describe("Glob", () => {
  test("scan() returns alphabetically ordered results", async () => {
    await FileSystem.write(`${tmpDir}/b.ts`, "b");
    await FileSystem.write(`${tmpDir}/a.ts`, "a");
    await FileSystem.write(`${tmpDir}/c.ts`, "c");
    const results = await Glob.scan("*.ts", { cwd: tmpDir });
    expect(results).toEqual(["a.ts", "b.ts", "c.ts"]);
  });
});
describe("LocalStorage", () => {
  test("write() and read().text() make roundtrip", async () => {
    const storage = new LocalStorage(tmpDir);
    await storage.write("test-storage.txt", "data");
    expect(await storage.exists("test-storage.txt")).toBe(true);
    const content = await storage.read("test-storage.txt").text();
    expect(content).toBe("data");
    await storage.delete("test-storage.txt");
    expect(await storage.exists("test-storage.txt")).toBe(false);
  });
  test("append() called three times preserves order and doesn't overwrite", async () => {
    const storage = new LocalStorage(tmpDir);
    await storage.append("append.txt", "line1\n");
    await storage.append("append.txt", "line2\n");
    await storage.append("append.txt", "line3\n");
    const content = await storage.read("append.txt").text();
    expect(content).toBe("line1\nline2\nline3\n");
  });
});
