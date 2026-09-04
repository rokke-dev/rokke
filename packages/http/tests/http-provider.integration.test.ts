import { afterEach, describe, expect, test } from "bun:test";
import { createServer } from "node:net";
import { Application, BootError, ServiceProvider, type Container } from "@rokke/core";
import { ConfigProvider, ConfigToken } from "@rokke/config";
import { LoggerProvider } from "@rokke/logger";
import { HttpProvider } from "../src";

const fixturePath = `${import.meta.dir}/fixtures/http-app`;
const originalPort = Bun.env.ROKKE_HTTP_INTEGRATION_PORT;
const originalAppEnv = Bun.env.APP_ENV;
const originalAppDebug = Bun.env.APP_DEBUG;

function reservePort(): Promise<number> {
  return new Promise((resolve, reject) => {
    const reservation = createServer();
    reservation.unref();
    reservation.once("error", reject);
    reservation.listen(0, "127.0.0.1", () => {
      const address = reservation.address();
      if (!address || typeof address === "string") {
        reservation.close();
        reject(new Error("Could not reserve an ephemeral TCP port"));
        return;
      }
      reservation.close((error) => error ? reject(error) : resolve(address.port));
    });
  });
}

afterEach(() => {
  if (originalPort === undefined) delete Bun.env.ROKKE_HTTP_INTEGRATION_PORT;
  else Bun.env.ROKKE_HTTP_INTEGRATION_PORT = originalPort;
  if (originalAppEnv === undefined) delete Bun.env.APP_ENV;
  else Bun.env.APP_ENV = originalAppEnv;
  if (originalAppDebug === undefined) delete Bun.env.APP_DEBUG;
  else Bun.env.APP_DEBUG = originalAppDebug;
  delete globalThis.__rokkeHttpStreamGate;
});

describe("HttpProvider integration", () => {
  test("discovers routes, serves protocol responses, drains streams and releases its port", async () => {
    let dependencyUp = true;
    class ProbeHealthProvider extends ServiceProvider {
      override async healthCheck() {
        return { status: dependencyUp ? "up" as const : "down" as const };
      }
    }
    const port = await reservePort();
    Bun.env.ROKKE_HTTP_INTEGRATION_PORT = String(port);
    const app = await Application.boot(fixturePath)
      .withProviders(ConfigProvider, LoggerProvider, HttpProvider, ProbeHealthProvider)
      .withDrainTimeout(2_000)
      .create();

    await app.start();
    const baseUrl = `http://127.0.0.1:${port}`;
    expect(app.state).toBe("ready");

    const discovered = await fetch(`${baseUrl}/api/probe`);
    expect(discovered.status).toBe(200);
    expect(await discovered.json()).toEqual({ ok: true });

    const head = await fetch(`${baseUrl}/api/probe`, { method: "HEAD" });
    expect(head.status).toBe(200);
    expect(await head.text()).toBe("");

    const options = await fetch(`${baseUrl}/api/probe`, { method: "OPTIONS" });
    expect(options.status).toBe(204);
    expect(options.headers.get("Allow")).toBe("GET, HEAD, OPTIONS");

    const methodNotAllowed = await fetch(`${baseUrl}/api/probe`, { method: "POST" });
    expect(methodNotAllowed.status).toBe(405);
    expect(methodNotAllowed.headers.get("Allow")).toBe("GET, HEAD, OPTIONS");
    expect((await fetch(`${baseUrl}/missing`)).status).toBe(404);

    expect(await (await fetch(`${baseUrl}/health`)).json()).toEqual({ status: "up" });
    const readiness = await (await fetch(`${baseUrl}/ready`)).json() as {
      status: string;
      checks: Array<{ provider: string; status: string }>;
    };
    expect(readiness.status).toBe("up");
    expect(readiness.checks).toContainEqual({ provider: "HttpProvider", status: "up" });

    dependencyUp = false;
    const unavailable = await fetch(`${baseUrl}/ready`);
    expect(unavailable.status).toBe(503);
    expect(await unavailable.json()).toMatchObject({ status: "down" });

    let releaseStream!: () => void;
    globalThis.__rokkeHttpStreamGate = {
      wait: new Promise<void>((resolve) => { releaseStream = resolve; }),
    };
    const streamed = await fetch(`${baseUrl}/api/probe/stream`);
    const shutdown = app.shutdown();
    let shutdownFinished = false;
    void shutdown.then(() => { shutdownFinished = true; });
    await Bun.sleep(75);
    expect(shutdownFinished).toBe(false);

    releaseStream();
    expect(await streamed.text()).toBe("start-end");
    await shutdown;
    expect(app.state).toBe("terminated");

    const rebound = Bun.serve({ port, fetch: () => new Response("released") });
    expect(rebound.port).toBe(port);
    rebound.stop(true);
  });

  test("rejects debug mode in production before binding the server port", async () => {
    const port = await reservePort();
    class ProductionConfigProvider extends ServiceProvider {
      override register(container: Container): void {
        container.bind(ConfigToken, () => ({
          app: { name: "Production test", env: "production", debug: true },
          http: { port },
        }));
      }
    }
    const app = await Application.boot(import.meta.dir)
      .withProviders(ProductionConfigProvider, HttpProvider)
      .create();

    const start = app.start();
    await expect(start).rejects.toBeInstanceOf(BootError);
    expect(app.state).toBe("errored");

    const available = Bun.serve({ port, fetch: () => new Response("available") });
    expect(available.port).toBe(port);
    available.stop(true);
  });
});
