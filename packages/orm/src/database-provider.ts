import { SQL } from "bun";
import { ServiceProvider, token, type Container } from "@rokke/core";
import { ConfigProvider, ConfigToken } from "@rokke/config";
import { Model } from "./model";
import { UnitOfWork } from "./unit-of-work";
export const SqlToken = token<SQL>("Sql");
export const UnitOfWorkToken = token<UnitOfWork>("UnitOfWork");
export class DatabaseProvider extends ServiceProvider {
  static override readonly dependsOn = [ConfigProvider];
  #sql: SQL | undefined;
  override register(container: Container): void {
    container.bind(SqlToken, () => {
      if (!this.#sql) throw new DatabaseNotReadyError();
      return this.#sql;
    }, "singleton");
    container.bind(UnitOfWorkToken, (c) => new UnitOfWork(c.get(SqlToken)), "singleton");
  }
  override async boot(): Promise<void> {
    const config = this.app.container.get(ConfigToken);
    const dbConfig = config.database as { url: string } | undefined;
    if (!dbConfig?.url) throw new MissingDatabaseUrlError();
    this.#sql = new SQL(dbConfig.url);
    Model.sqlConnection = this.#sql; 
  }
  override async shutdown(): Promise<void> {
    await this.#sql?.close();
  }
  override async healthCheck() {
    try {
      await this.#sql!.unsafe("SELECT 1", []);
      return { status: "up" as const };
    } catch (error) {
      return { status: "down" as const, detail: String(error) };
    }
  }
}
export class DatabaseNotReadyError extends Error {
  constructor() { super("SqlToken se resolvió antes de que DatabaseProvider.boot() terminara — ¿falta dependsOn: [DatabaseProvider]?"); this.name = "DatabaseNotReadyError"; }
}
export class MissingDatabaseUrlError extends Error {
  constructor() { super('Falta "database.url" en la configuración.'); this.name = "MissingDatabaseUrlError"; }
}
