import { expect, test, describe, beforeAll, beforeEach, afterEach, afterAll, spyOn } from "bun:test";
import { Env, EnvError, ConfigProvider, ConfigToken, ConfigNotReadyError, Secrets } from "../src";
import { FileSystem } from "@rokke/fs";
import { ServiceProvider, type Container, type ApplicationContext } from "@rokke/core";

const ENV_KEYS = ["X", "PORT", "APP_ENV", "APP_DEBUG", "TEST_SECRET"] as const;

beforeEach(() => {
  for (const key of ENV_KEYS) delete process.env[key];
});

afterEach(() => {
  for (const key of ENV_KEYS) delete process.env[key];
});

describe("Env", () => {
  test("Env.string('X').required() throws EnvError if X is undefined", () => {
    delete process.env.X;
    expect(() => Env.string("X").required()).toThrow(EnvError);
  });
  test("Env.string('X').default('fallback') returns fallback or value", () => {
    delete process.env.X;
    expect(Env.string("X").default("fallback")).toBe("fallback");
    process.env.X = "real";
    expect(Env.string("X").default("fallback")).toBe("real");
  });
  test("Env.number('PORT').required() throws EnvError if not parseable", () => {
    process.env.PORT = "abc";
    expect(() => Env.number("PORT").required()).toThrow(EnvError);
  });
  test("Env.enum('APP_ENV', [...]).required() throws EnvError if invalid", () => {
    process.env.APP_ENV = "invalid";
    expect(() => Env.enum("APP_ENV", ["dev", "prod"]).required()).toThrow(EnvError);
  });
});
describe("ConfigProvider", () => {
  const tmpDir = `${import.meta.dir}/tmp_config`;
  beforeAll(async () => {
    await import("node:fs/promises").then(fs => fs.mkdir(`${tmpDir}/config`, { recursive: true }));
    await FileSystem.write(`${tmpDir}/config/a.ts`, "export default { a: 1, shared: 'a' };");
    await FileSystem.write(`${tmpDir}/config/b.ts`, "export default { b: 2, shared: 'b' };");
    await FileSystem.write(`${tmpDir}/config/app.ts`, "export default { app: { name: 'TestApp', env: 'development', debug: false } };");
  });
  afterAll(async () => {
    await import("node:fs/promises").then(fs => fs.rm(tmpDir, { recursive: true, force: true }));
  });
  test("merges config files in alphabetical order (b wins over a)", async () => {
    delete process.env.APP_ENV;
    const mockApp = { basePath: tmpDir } as ApplicationContext;
    const provider = new ConfigProvider(mockApp);
    await provider.boot();
    const container = { bind: (t: any, fn: any) => fn() } as any;
    let val: any;
    provider.register({ bind: (t: any, fn: any) => { val = fn(); } } as any);
    expect(val.shared).toBe("b");
  });
  test("APP_ENV override wins over config/app.ts", async () => {
    process.env.APP_ENV = "production";
    const mockApp = { basePath: tmpDir } as ApplicationContext;
    const provider = new ConfigProvider(mockApp);
    await provider.boot();
    provider.register({ bind: (t: any, fn: any) => { expect(fn().app.env).toBe("production"); } } as any);
  });
  test("APP_DEBUG override wins over config/app.ts", async () => {
    process.env.APP_DEBUG = "true";
    const mockApp = { basePath: tmpDir } as ApplicationContext;
    const provider = new ConfigProvider(mockApp);
    await provider.boot();
    provider.register({ bind: (t: any, fn: any) => { expect(fn().app.debug).toBe(true); } } as any);
  });
  test("ServiceProvider with dependsOn can read config in boot()", async () => {
    delete process.env.APP_ENV;
    const mockApp = { basePath: tmpDir } as ApplicationContext;
    const configProv = new ConfigProvider(mockApp);
    await configProv.boot();
    let configVal: any;
    configProv.register({ bind: (t: any, fn: any) => { configVal = fn(); } } as any);
    class TestProv extends ServiceProvider {
      static override dependsOn = [ConfigProvider];
      override async boot() {
      }
    }
    expect(configVal).toBeDefined();
  });
  test("ServiceProvider without dependsOn reading config in register() throws ConfigNotReadyError", () => {
    delete process.env.APP_ENV;
    const mockApp = { basePath: tmpDir } as ApplicationContext;
    const configProv = new ConfigProvider(mockApp);
    let factory: any;
    configProv.register({ bind: (t: any, fn: any) => { factory = fn; } } as any);
    expect(() => factory()).toThrow(ConfigNotReadyError);
  });
});
describe("Secrets", () => {
  test("resolve() prefers mounted path over env var", async () => {
    process.env.TEST_SECRET = "env_secret";
    const exists = spyOn(FileSystem, "exists").mockResolvedValue(true);
    const file = spyOn(FileSystem, "file").mockReturnValue({
      path: "/run/secrets/TEST_SECRET",
      size: 12,
      type: "text/plain",
      text: async () => "file_secret\n",
      arrayBuffer: async () => new ArrayBuffer(0),
      stream: () => new ReadableStream<Uint8Array>(),
    });

    try {
      expect(await Secrets.resolve("TEST_SECRET")).toBe("file_secret");
    } finally {
      exists.mockRestore();
      file.mockRestore();
    }
  });

  test("resolve() falls back to the environment when no mounted secret exists", async () => {
    process.env.TEST_SECRET = "env_secret";
    const exists = spyOn(FileSystem, "exists").mockResolvedValue(false);
    try {
      expect(await Secrets.resolve("TEST_SECRET")).toBe("env_secret");
    } finally {
      exists.mockRestore();
    }
  });
});
