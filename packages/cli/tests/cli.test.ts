import { expect, test, describe } from "bun:test";
import { parseSignature, dispatch, UnknownCommandError, MissingArgumentError } from "../src/dispatcher";
import { Command } from "../src/command";
import { DoctorCommand } from "../src/commands/doctor.command";
import { InMemoryContainer } from "@rokke/core";
import { MigrateCommand } from "../src/commands/migrate.command";
import { SqlToken } from "@rokke/orm";
describe("CLI", () => {
  test("parseSignature()", () => {
    const parsed = parseSignature("make:controller <name> [module]");
    expect(parsed.name).toBe("make:controller");
    expect(parsed.positional[0]).toEqual({ name: "name", required: true });
    expect(parsed.positional[1]).toEqual({ name: "module", required: false });
  });
  test("dispatch() command inexistent", async () => {
    const app: any = { container: new InMemoryContainer(), trackExecutionContext: () => {}, untrackExecutionContext: () => {} };
    await expect(dispatch(app, ["fake"], [])).rejects.toThrow(UnknownCommandError);
  });
  test("dispatch() missing argument", async () => {
    class FakeCommand extends Command {
      signature = "make:fake <name>";
      description = "";
      async handle() {}
    }
    const app: any = { container: new InMemoryContainer(), trackExecutionContext: () => {}, untrackExecutionContext: () => {} };
    await expect(dispatch(app, ["make:fake"], [new FakeCommand()])).rejects.toThrow(MissingArgumentError);
  });
  test("CliCommandContext onDispose running even on error", async () => {
    let disposed = false;
    class ThrowCommand extends Command {
      signature = "throw";
      description = "";
      async handle(ctx: any) {
        ctx.onDispose(async () => { disposed = true; });
        throw new Error("fail");
      }
    }
    const app: any = { container: { createScope: () => ({}) }, trackExecutionContext: () => {}, untrackExecutionContext: () => {} };
    await expect(dispatch(app, ["throw"], [new ThrowCommand()])).rejects.toThrow("fail");
    expect(disposed).toBe(true);
  });
  test("DoctorCommand reporta provider con healthCheck", async () => {
    const cmd = new DoctorCommand();
    const mockApp = {
      getBootedProviders: () => [{ constructor: { name: "TestProvider" }, healthCheck: async () => ({ status: "down", detail: "db error" }) }]
    };
    let output = "";
    const ctx: any = { app: mockApp, writeOut: (text: string) => { output += text; } };
    await cmd.handle(ctx);
    expect(output).toBe("TestProvider: down (db error)\n");
  });
  test("dispatch limpia tracking y listener SIGINT al finalizar", async () => {
    class SuccessCommand extends Command {
      signature = "success";
      description = "";
      async handle() {}
    }
    const tracked: unknown[] = [];
    const untracked: unknown[] = [];
    const listenersBefore = process.listenerCount("SIGINT");
    const app: any = {
      container: new InMemoryContainer(),
      trackExecutionContext: (context: unknown) => tracked.push(context),
      untrackExecutionContext: (context: unknown) => untracked.push(context),
    };

    await dispatch(app, ["success"], [new SuccessCommand()]);

    expect(tracked).toHaveLength(1);
    expect(untracked).toEqual(tracked);
    expect(process.listenerCount("SIGINT")).toBe(listenersBefore);
  });
  test("MigrateCommand usa MigrationLock (lock adquirido throws)", async () => {
    const cmd = new MigrateCommand();
    const mockSql: any = async () => {};
    const container = new InMemoryContainer();
    container.bind(SqlToken, () => mockSql, "singleton");
    mockSql.begin = async () => {};
    mockSql.commit = async () => {};
    mockSql.rollback = async () => {};
    mockSql.unsafe = async () => { throw new Error("canceling statement due to statement timeout"); }; 
    const ctx: any = { container };
    await expect(cmd.handle(ctx)).rejects.toThrow("canceling statement due to statement timeout");
  });
});
