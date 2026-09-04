import { describe, expect, test } from "bun:test";
import { Application, ServiceProvider } from "../src";

describe("Application signal lifecycle", () => {
  test("removes its process signal handlers after shutdown", async () => {
    class Provider extends ServiceProvider {}
    const sigintBefore = process.listenerCount("SIGINT");
    const sigtermBefore = process.listenerCount("SIGTERM");
    const app = await Application.boot(import.meta.dir).withProviders(Provider).create();

    expect(process.listenerCount("SIGINT")).toBe(sigintBefore + 1);
    expect(process.listenerCount("SIGTERM")).toBe(sigtermBefore + 1);
    await app.start();
    await app.shutdown();

    expect(process.listenerCount("SIGINT")).toBe(sigintBefore);
    expect(process.listenerCount("SIGTERM")).toBe(sigtermBefore);
  });

  test("removes its process signal handlers when boot fails", async () => {
    class FailingProvider extends ServiceProvider {
      override async boot(): Promise<void> {
        throw new Error("boot failed");
      }
    }
    const sigintBefore = process.listenerCount("SIGINT");
    const sigtermBefore = process.listenerCount("SIGTERM");
    const app = await Application.boot(import.meta.dir).withProviders(FailingProvider).create();

    await expect(app.start()).rejects.toThrow("FailingProvider");
    expect(process.listenerCount("SIGINT")).toBe(sigintBefore);
    expect(process.listenerCount("SIGTERM")).toBe(sigtermBefore);
  });
});
