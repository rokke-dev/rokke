import { expect, test, describe, beforeAll, afterAll, mock } from "bun:test";
import { FrameworkLogger, ConsoleTransport, JsonTransport, FileTransport, defaultLogger, LoggerProvider, LoggerToken } from "../src";
import { FileSystem, LocalStorage } from "@rokke/fs";
import { runInExecutionContext, ExecutionContext, type Container, type ApplicationContext } from "@rokke/core";
import { ConfigToken } from "@rokke/config";
class DummyContext extends ExecutionContext {
  kind = "http" as const;
  container: any;
  signal = new AbortController().signal;
  correlationId = "corr-123";
  toTraceParent() { return "dummy"; }
  onDispose = () => {};
  async [Symbol.asyncDispose]() {}
}
describe("FrameworkLogger", () => {
  test("writes to all transports", () => {
    let count1 = 0;
    let count2 = 0;
    const t1 = { write: () => { count1++; } };
    const t2 = { write: () => { count2++; } };
    const logger = new FrameworkLogger([t1, t2]);
    logger.info("msg");
    expect(count1).toBe(1);
    expect(count2).toBe(1);
  });
  test("minLevel filters correctly", () => {
    let count = 0;
    const t = { write: () => { count++; } };
    const logger = new FrameworkLogger([t], "default", "warn");
    logger.debug("msg");
    logger.info("msg");
    expect(count).toBe(0);
    logger.warn("msg");
    logger.error("msg");
    expect(count).toBe(2);
  });
  test("channel() creates new logger with same transports and new channel", () => {
    let lastEntry: any;
    const t = { write: (e: any) => { lastEntry = e; } };
    const logger = new FrameworkLogger([t]).channel("audit");
    logger.info("msg");
    expect(lastEntry.channel).toBe("audit");
  });
  test("correlationId injected if ExecutionContext is active", () => {
    let lastEntry: any;
    const t = { write: (e: any) => { lastEntry = e; } };
    const logger = new FrameworkLogger([t]);
    logger.info("out");
    expect(lastEntry.correlationId).toBeUndefined();
    runInExecutionContext(new DummyContext(), () => {
      logger.info("in");
      expect(lastEntry.correlationId).toBe("corr-123");
    });
  });
});
describe("Transports", () => {
  test("ConsoleTransport", () => {
    const origLog = console.log;
    const origErr = console.error;
    let logMsg = "";
    let errMsg = "";
    console.log = (m) => { logMsg = m; };
    console.error = (m) => { errMsg = m; };
    const t = new ConsoleTransport();
    t.write({ level: "info", message: "hi", channel: "c", timestamp: "t" });
    expect(logMsg).toContain("INFO");
    expect(logMsg).toContain("hi");
    t.write({ level: "error", message: "err", channel: "c", timestamp: "t", correlationId: "corr" });
    expect(errMsg).toContain("ERROR");
    expect(errMsg).toContain("err");
    expect(errMsg).toContain("[corr]");
    console.log = origLog;
    console.error = origErr;
  });
  test("JsonTransport", () => {
    let lastLine = "";
    const t = new JsonTransport((line) => { lastLine = line; });
    t.write({ level: "info", message: "hi", channel: "c", timestamp: "t" });
    const parsed = JSON.parse(lastLine);
    expect(parsed.level).toBe("info");
    expect(parsed.message).toBe("hi");
  });
  const tmpDir = `${import.meta.dir}/tmp_logger`;
  beforeAll(async () => {
    await import("node:fs/promises").then(fs => fs.mkdir(tmpDir, { recursive: true }));
  });
  afterAll(async () => {
    await import("node:fs/promises").then(fs => fs.rm(tmpDir, { recursive: true, force: true }));
  });
  test("FileTransport", async () => {
    const storage = new LocalStorage(tmpDir);
    const t = new FileTransport(storage, "test.log");
    await t.write({ level: "info", message: "hi", channel: "c", timestamp: "t" });
    await t.write({ level: "error", message: "err", channel: "c", timestamp: "t" });
    const content = await storage.read("test.log").text();
    const lines = content.trim().split("\n");
    expect(lines.length).toBe(2);
    expect(JSON.parse(lines[0]!).level).toBe("info");
    expect(JSON.parse(lines[1]!).level).toBe("error");
  });
});
describe("defaultLogger", () => {
  test("works without container", () => {
    expect(defaultLogger).toBeDefined();
    expect(() => defaultLogger.info("test")).not.toThrow();
  });
});
describe("LoggerProvider", () => {
  test("binds LoggerToken configuring depending on ConfigToken", () => {
    const p = new LoggerProvider({} as any);
    const container = {
      bind: (token: any, factory: any) => {
        const c = { get: () => ({ app: { env: "production", debug: true } }) };
        const logger = factory(c);
        expect(logger).toBeInstanceOf(FrameworkLogger);
      }
    };
    p.register(container as any);
  });
});
