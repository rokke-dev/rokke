import { expect, test, describe, mock } from "bun:test";
import { Kernel } from "../src/kernel/kernel";
import { InMemoryContainer } from "../src/container/in-memory-container";
import { ServiceProvider, type ApplicationContext, ProviderDependencyCycleError, ExecutionContext } from "../src";
import { InvalidStateTransitionError, BootError } from "../src/kernel/errors";
import { bootstrapReporter } from "../src/bootstrap-reporter";
const mockApp = {} as ApplicationContext;
describe("Kernel", () => {
  test("happy path: created -> registering -> booting -> ready, respects dependsOn", async () => {
    const log: string[] = [];
    class ProvA extends ServiceProvider {
      override register() { log.push("regA"); }
      override async boot() { log.push("bootA"); }
    }
    class ProvB extends ServiceProvider {
      static override dependsOn = [ProvA];
      override register() { log.push("regB"); }
      override async boot() { log.push("bootB"); }
    }
    const kernel = new Kernel(new InMemoryContainer());
    expect(kernel.state).toBe("created");
    kernel.registerProviders([new ProvB(mockApp), new ProvA(mockApp)]);
    await kernel.start();
    expect(kernel.state).toBe("ready");
    expect(log).toEqual(["regA", "regB", "bootA", "bootB"]);
  });
  test("register() throws -> state errored, no boot executed", async () => {
    let booted = false;
    class BadProv extends ServiceProvider {
      override register() { throw new Error("reg fail"); }
      override async boot() { booted = true; }
    }
    const kernel = new Kernel(new InMemoryContainer());
    kernel.registerProviders([new BadProv(mockApp)]);
    await expect(kernel.start()).rejects.toThrow("reg fail");
    expect(kernel.state).toBe("errored");
    expect(booted).toBe(false);
  });
  test("boot() throws -> state errored, shutdown called on previously booted in reverse order", async () => {
    const log: string[] = [];
    class Prov1 extends ServiceProvider {
      override async boot() { log.push("boot1"); }
      override async shutdown() { log.push("shut1"); }
    }
    class Prov2 extends ServiceProvider {
      override async boot() { log.push("boot2"); throw new Error("boot fail"); }
      override async shutdown() { log.push("shut2"); }
    }
    class Prov3 extends ServiceProvider {
      override async boot() { log.push("boot3"); }
      override async shutdown() { log.push("shut3"); }
    }
    const kernel = new Kernel(new InMemoryContainer());
    kernel.registerProviders([new Prov1(mockApp), new Prov2(mockApp), new Prov3(mockApp)]);
    await expect(kernel.start()).rejects.toThrow(BootError);
    expect(kernel.state).toBe("errored");
    expect(log).toEqual(["boot1", "boot2", "shut1"]);
  });
  test("cycle in dependsOn is detected before any register()", () => {
    let regCalled = false;
    class ProvA extends ServiceProvider {
      static override get dependsOn() { return [ProvB]; }
      override register() { regCalled = true; }
    }
    class ProvB extends ServiceProvider {
      static override get dependsOn() { return [ProvA]; }
    }
    const kernel = new Kernel(new InMemoryContainer());
    expect(() => kernel.registerProviders([new ProvA(mockApp), new ProvB(mockApp)])).toThrow(ProviderDependencyCycleError);
    expect(regCalled).toBe(false);
  });
  test("shutdown() transitions to draining then terminated, calls shutdown in reverse", async () => {
    const log: string[] = [];
    class Prov1 extends ServiceProvider {
      override async shutdown() { log.push("shut1"); }
    }
    class Prov2 extends ServiceProvider {
      override async shutdown() { log.push("shut2"); }
    }
    const kernel = new Kernel(new InMemoryContainer());
    kernel.registerProviders([new Prov1(mockApp), new Prov2(mockApp)]);
    await kernel.start();
    expect(kernel.state).toBe("ready");
    const p = kernel.shutdown();
    expect(kernel.state).toBe("draining");
    await p;
    expect(kernel.state).toBe("terminated");
    expect(log).toEqual(["shut2", "shut1"]);
  });
  test("shutdown() before ready throws InvalidStateTransitionError", async () => {
    const kernel = new Kernel(new InMemoryContainer());
    await expect(kernel.shutdown()).rejects.toThrow(InvalidStateTransitionError);
  });
  test("draining waits for inFlightContexts to empty", async () => {
    const kernel = new Kernel(new InMemoryContainer(), { drainTimeoutMs: 1000 });
    kernel.registerProviders([]);
    await kernel.start();
    const ctx = {} as ExecutionContext;
    kernel.trackExecutionContext(ctx);
    let shutdownDone = false;
    const shutdownPromise = kernel.shutdown().then(() => { shutdownDone = true; });
    await new Promise(r => setTimeout(r, 100));
    expect(shutdownDone).toBe(false);
    kernel.untrackExecutionContext(ctx);
    await shutdownPromise;
    expect(shutdownDone).toBe(true);
  });
  test("drain timeout logs warn and forces shutdown", async () => {
    const warnSpy = mock((_msg: string) => {});
    const origWarn = bootstrapReporter.warn;
    bootstrapReporter.warn = warnSpy;
    const kernel = new Kernel(new InMemoryContainer(), { drainTimeoutMs: 100 });
    kernel.registerProviders([]);
    await kernel.start();
    const ctx = {} as ExecutionContext;
    kernel.trackExecutionContext(ctx);
    await kernel.shutdown();
    expect(warnSpy).toHaveBeenCalled();
    expect(kernel.state).toBe("terminated");
    bootstrapReporter.warn = origWarn;
  });
  test("without dependsOn, boot order is array order", async () => {
    const log1: string[] = [];
    class Prov1 extends ServiceProvider { override async boot() { log1.push("1"); } }
    class Prov2 extends ServiceProvider { override async boot() { log1.push("2"); } }
    const kernel1 = new Kernel(new InMemoryContainer());
    kernel1.registerProviders([new Prov1(mockApp), new Prov2(mockApp)]);
    await kernel1.start();
    expect(log1).toEqual(["1", "2"]);
    const log2: string[] = [];
    class Prov3 extends ServiceProvider { override async boot() { log2.push("3"); } }
    class Prov4 extends ServiceProvider { override async boot() { log2.push("4"); } }
    const kernel2 = new Kernel(new InMemoryContainer());
    kernel2.registerProviders([new Prov4(mockApp), new Prov3(mockApp)]);
    await kernel2.start();
    expect(log2).toEqual(["4", "3"]);
  });
});
