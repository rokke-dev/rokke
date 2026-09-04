import { expect, test, describe } from "bun:test";
import { DevtoolsProvider, DevtoolsMustNotRunInProductionError } from "../src/devtools-provider";
import { ConfigProvider, ConfigToken } from "@rokke/config";
import { InMemoryContainer } from "@rokke/core";
describe("Devtools", () => {
  test("DevtoolsProvider.register() con app.env: 'production' lanza DevtoolsMustNotRunInProductionError", () => {
    const container = new InMemoryContainer();
    container.bind(ConfigToken, () => ({ app: { env: "production" } }), "singleton");
    const app: any = { container };
    const provider = new DevtoolsProvider(app);
    expect(() => provider.register(container)).toThrow(DevtoolsMustNotRunInProductionError);
  });
  test("El buffer de perfiles nunca excede 100 entradas", () => {
    const container = new InMemoryContainer();
    container.bind(ConfigToken, () => ({ app: { env: "development" } }), "singleton");
    const app: any = { container };
    const provider = new DevtoolsProvider(app);
    provider.register(container);
    for (let i = 0; i < 105; i++) {
      provider.recordProfile({
        correlationId: `id-${i}`,
        route: { pattern: "/", controller: "test", method: "GET" },
        timings: { middleware: [], total: 10 },
        queries: []
      });
    }
    expect(provider.getProfile("id-0")).toBeUndefined();
    expect(provider.getProfile("id-4")).toBeUndefined();
    expect(provider.getProfile("id-5")).toBeDefined();
    expect(provider.getProfile("id-104")).toBeDefined();
  });
});
