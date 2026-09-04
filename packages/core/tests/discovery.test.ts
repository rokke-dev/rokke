import { test, expect, describe, beforeEach, afterEach, spyOn } from "bun:test";
import { Glob } from "@rokke/fs";
import { 
  discoverModules, 
  Injectable, 
  bindInjectable, 
  NotInjectableError, 
  discoverProviderClasses, 
  Application,
  token,
  InMemoryContainer,
  ServiceProvider
} from "../src";
import { join } from "path";
import { rm, mkdir } from "fs/promises";
describe("discovery", () => {
  const testDir = join(process.cwd(), "packages/core/tests/tmp_discovery");
  beforeEach(async () => {
    await rm(testDir, { recursive: true, force: true });
    await mkdir(testDir, { recursive: true });
  });
  afterEach(async () => {
    await rm(testDir, { recursive: true, force: true });
  });
  describe("discoverModules", () => {
    test("discovers and imports modules in alphabetical order", async () => {
      await Bun.write(join(testDir, "b.provider.ts"), "export const name = 'b';");
      await Bun.write(join(testDir, "a.provider.ts"), "export const name = 'a';");
      await Bun.write(join(testDir, "c.provider.ts"), "export const name = 'c';");
      const modules = await discoverModules("*.provider.ts", testDir);
      expect(modules.map(m => m.filePath)).toEqual(["a.provider.ts", "b.provider.ts", "c.provider.ts"]);
      expect(modules.map(m => m.exports.name)).toEqual(["a", "b", "c"]);
    });
    test("returns empty array if no files matched", async () => {
      const modules = await discoverModules("*.missing.ts", testDir);
      expect(modules).toEqual([]);
    });
  });
  describe("Injectable / bindInjectable", () => {
    const TokenA = token<string>("A");
    const TokenB = token<number>("B");
    test("auto-constructs with dependencies", () => {
      @Injectable()
      class MyService {
        static readonly inject = [TokenA, TokenB] as const;
        a: string;
        b: number;
        constructor(a: string, b: number) { this.a = a; this.b = b; }
      }
      const container = new InMemoryContainer();
      container.bind(TokenA, () => "hello", "singleton");
      container.bind(TokenB, () => 42, "singleton");
      const MyServiceToken = token<MyService>("MyService");
      bindInjectable(container, MyServiceToken, MyService);
      const instance = container.get(MyServiceToken);
      expect(instance.a).toBe("hello");
      expect(instance.b).toBe(42);
    });
    test("auto-constructs without dependencies", () => {
      @Injectable()
      class EmptyService {
        ok = true;
      }
      const container = new InMemoryContainer();
      const EmptyServiceToken = token<EmptyService>("EmptyService");
      bindInjectable(container, EmptyServiceToken, EmptyService);
      const instance = container.get(EmptyServiceToken);
      expect(instance.ok).toBe(true);
    });
    test("throws NotInjectableError if class not decorated", () => {
      class NormalClass {}
      const container = new InMemoryContainer();
      const NormalToken = token<NormalClass>("Normal");
      expect(() => bindInjectable(container, NormalToken, NormalClass)).toThrow(NotInjectableError);
    });
    test("metadata is isolated per class", () => {
      @Injectable() class A {}
      class B {}
      @Injectable() class C {}
      const container = new InMemoryContainer();
      expect(() => bindInjectable(container, token<A>("A"), A)).not.toThrow();
      expect(() => bindInjectable(container, token<B>("B"), B)).toThrow();
      expect(() => bindInjectable(container, token<C>("C"), C)).not.toThrow();
    });
  });
  describe("discoverProviderClasses", () => {
    test("ignores files that do not export ServiceProvider classes", async () => {
      await Bun.write(join(testDir, "real.provider.ts"), "import { ServiceProvider } from '@rokke/core';\nexport class RealProvider extends ServiceProvider { override register() {} }");
      await Bun.write(join(testDir, "fake.provider.ts"), "export interface Fake {}\nexport class NotAProvider {}\nexport const val = 42;");
      const classes = await discoverProviderClasses(testDir, "*.provider.ts");
      expect(classes.length).toBe(1);
      expect(classes[0]?.name).toBe("RealProvider");
    });
  });
  describe("ApplicationBuilder discovery", () => {
    test("auto-discovers providers when withProviders is omitted", async () => {
      await mkdir(join(testDir, "src"), { recursive: true });
      await Bun.write(join(testDir, "src/my.provider.ts"), "import { ServiceProvider } from '@rokke/core';\nexport class MyProvider extends ServiceProvider { override register() {} }");
      const app = await Application.boot(testDir).create();
      await app.start();
      const booted = app.getBootedProviders();
      expect(booted.length).toBe(1);
      expect(booted[0]?.constructor.name).toBe("MyProvider");
    });
    test("skips discovery when withProviders is used explicitly", async () => {
      class ExplicitProvider extends ServiceProvider {
        override register() {}
      }
      await mkdir(join(testDir, "src"), { recursive: true });
      await Bun.write(join(testDir, "src/unused.provider.ts"), "import { ServiceProvider } from '@rokke/core';\nexport class UnusedProvider extends ServiceProvider { override register() {} }");
      const app = await Application.boot(testDir).withProviders(ExplicitProvider).create();
      await app.start();
      const booted = app.getBootedProviders();
      expect(booted.length).toBe(1);
      expect(booted[0]?.constructor.name).toBe("ExplicitProvider");
    });
  });
});