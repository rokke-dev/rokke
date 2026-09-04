import type { SQL } from "bun";
/**
 * Lock de migraciones concurrentes — hueco identificado en una auditoría
 * anterior. Usa un advisory lock de Postgres: si dos instancias arrancan
 * `cli migrate` a la vez (rolling update típico), la segunda espera a que
 * la primera termine, en vez de correr el mismo ALTER TABLE dos veces.
 */
export class MigrationLock {
  static readonly LOCK_KEY = 0x726f6b6b65; 
  readonly sql: SQL;
  constructor(sql: SQL) {
    this.sql = sql;
  }
  async acquire(): Promise<void> { await this.sql.unsafe("SELECT pg_advisory_lock($1)", [MigrationLock.LOCK_KEY]); }
  async release(): Promise<void> { await this.sql.unsafe("SELECT pg_advisory_unlock($1)", [MigrationLock.LOCK_KEY]); }
}
