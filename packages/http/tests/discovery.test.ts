import { test, expect, describe, beforeEach, afterEach } from "bun:test";
import { Controller, Get, readControllerMetadata, HttpProvider } from "../src";
import { Application, bindInjectable, token, InMemoryContainer, ServiceProvider } from "@rokke/core";
import { join } from "path";
import { rm, mkdir } from "fs/promises";
import { ConfigToken, type AppConfig } from "@rokke/config";

describe("http discovery", () => {
  const testDir = join(process.cwd(), "packages/http/tests/tmp_discovery");
  beforeEach(async () => {
    await rm(testDir, { recursive: true, force: true });
    await mkdir(join(testDir, "src"), { recursive: true });
  });
  afterEach(async () => {
    await rm(testDir, { recursive: true, force: true });
  });
  describe("Decorators metadata", () => {
    test("collects metadata correctly", () => {
      @Controller("/users")
      class UserController {
        @Get("/:id")
        show() {}
      }
      const meta = readControllerMetadata(UserController);
      expect(meta!.controllerBasePath).toBe("/users");
    });
  });
});