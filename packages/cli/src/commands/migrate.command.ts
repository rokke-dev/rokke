import { Command } from "../command";
import { discoverModules } from "@rokke/core";
import { MigrationLock, SqlToken } from "@rokke/orm";
export class MigrateCommand extends Command {
  readonly signature = "migrate";
  readonly description = "Runner experimental de migraciones; incompleto en este alpha.";
  async handle(ctx: import("../cli-command-context").CliCommandContext): Promise<void> {
    const sql = ctx.container.get(SqlToken as never) as any;
    const lock = new MigrationLock(sql);
    await lock.acquire();
    try {
      const modules = await discoverModules("database/migrations/*.ts", ctx.app.basePath);
      for (const { exports } of modules) {
        const MigrationClass = Object.values(exports).find((v) => typeof v === "function") as (new (schema: unknown) => { up(): Promise<void> }) | undefined;
        if (!MigrationClass) continue;
        const migration = new MigrationClass(undefined);
        await migration.up();
        ctx.writeOut(`Migrada: ${MigrationClass.name}\n`);
      }
    } finally {
      await lock.release();
    }
  }
}
