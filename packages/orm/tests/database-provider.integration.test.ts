import { describe, expect, test } from "bun:test";
import {
  Application,
  ExecutionContext,
  ServiceProvider,
  runInExecutionContext,
  type Container,
} from "@rokke/core";
import { ConfigToken } from "@rokke/config";
import { DatabaseProvider, SqlToken, UnitOfWorkToken } from "../src";

class TransactionContext extends ExecutionContext {
  readonly kind = "job" as const;
  readonly signal = new AbortController().signal;
  readonly correlationId = crypto.randomUUID();
  readonly container: Container;
  readonly #cleanup: Array<() => Promise<void>> = [];

  constructor(container: Container) {
    super();
    this.container = container.createScope(this);
  }

  readonly onDispose = (cleanup: () => Promise<void>): void => {
    this.#cleanup.push(cleanup);
  };

  toTraceParent(): string {
    return "00-00000000000000000000000000000000-0000000000000000-01";
  }

  async [Symbol.asyncDispose](): Promise<void> {
    for (const cleanup of [...this.#cleanup].reverse()) await cleanup();
  }
}

describe("DatabaseProvider SQLite integration", () => {
  test("connects, reports health, commits, rolls back and closes", async () => {
    class SQLiteConfigProvider extends ServiceProvider {
      override register(container: Container): void {
        container.bind(ConfigToken, () => ({
          app: { name: "SQLite integration", env: "development", debug: false },
          database: { url: "sqlite://:memory:" },
        }));
      }
    }
    const app = await Application.boot(import.meta.dir)
      .withProviders(SQLiteConfigProvider, DatabaseProvider)
      .create();

    await app.start();
    const sql = app.container.get(SqlToken);
    const databaseProvider = app.getBootedProviders().find(
      (provider): provider is DatabaseProvider => provider instanceof DatabaseProvider,
    );
    expect(databaseProvider).toBeDefined();
    expect(await databaseProvider!.healthCheck()).toEqual({ status: "up" });

    await sql.unsafe("CREATE TABLE records (id INTEGER PRIMARY KEY, value TEXT NOT NULL)", []);
    const unitOfWork = app.container.get(UnitOfWorkToken);

    const committedContext = new TransactionContext(app.container);
    await runInExecutionContext(committedContext, async () => {
      const transaction = await unitOfWork.begin();
      await transaction.sql.unsafe("INSERT INTO records (value) VALUES ($1)", ["committed"]);
      await transaction.commit();
    });
    await committedContext[Symbol.asyncDispose]();

    const rolledBackContext = new TransactionContext(app.container);
    await runInExecutionContext(rolledBackContext, async () => {
      const transaction = await unitOfWork.begin();
      await transaction.sql.unsafe("INSERT INTO records (value) VALUES ($1)", ["rolled back"]);
      await transaction.rollback();
    });
    await rolledBackContext[Symbol.asyncDispose]();

    const automaticRollbackContext = new TransactionContext(app.container);
    await runInExecutionContext(automaticRollbackContext, async () => {
      const transaction = await unitOfWork.begin();
      await transaction.sql.unsafe("INSERT INTO records (value) VALUES ($1)", ["automatic rollback"]);
    });
    await automaticRollbackContext[Symbol.asyncDispose]();

    const rows = await sql.unsafe("SELECT value FROM records ORDER BY id", []) as Array<{ value: string }>;
    expect(rows.map((row) => row.value)).toEqual(["committed"]);

    await app.shutdown();
    expect(app.state).toBe("terminated");
  });
});
