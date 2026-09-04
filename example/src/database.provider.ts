import { ServiceProvider, type ApplicationContext, type Container } from "@rokke/core";
import { ConfigProvider } from "@rokke/config";
import { HttpProvider } from "@rokke/http";
import { LoggerProvider } from "@rokke/logger";
import { DatabaseProvider, SqlToken } from "@rokke/orm";

export class ExampleDatabaseProvider extends ServiceProvider {
  static override readonly dependsOn = [DatabaseProvider];

  override async boot(): Promise<void> {
    const sql = this.app.container.get(SqlToken);
    await sql.unsafe(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT NOT NULL UNIQUE,
        passwordHash TEXT NOT NULL
      )
    `);
    await sql.unsafe(`
      CREATE TABLE IF NOT EXISTS tasks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        ownerId INTEGER NOT NULL,
        title TEXT NOT NULL,
        description TEXT NOT NULL DEFAULT '',
        completed INTEGER NOT NULL DEFAULT 0,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL,
        FOREIGN KEY (ownerId) REFERENCES users(id) ON DELETE CASCADE
      )
    `);
    await sql.unsafe("CREATE INDEX IF NOT EXISTS tasks_owner_id ON tasks(ownerId)");
  }
}

export class ExampleHttpProvider extends ServiceProvider {
  static override readonly dependsOn = [ConfigProvider, LoggerProvider, ExampleDatabaseProvider];
  readonly #http: HttpProvider;

  constructor(app: ApplicationContext) {
    super(app);
    this.#http = new HttpProvider(app);
  }

  override register(container: Container): void {
    this.#http.register(container);
  }

  override boot(): Promise<void> {
    return this.#http.boot();
  }

  override shutdown(): Promise<void> {
    return this.#http.shutdown();
  }

  override healthCheck(): Promise<{ status: "up" }> {
    return this.#http.healthCheck();
  }
}
