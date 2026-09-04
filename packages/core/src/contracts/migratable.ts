/**
 * Contract for an entity that manages migrations.
 */
export interface Migratable {
  /**
   * Applies the migration.
   */
  up(): Promise<void>;
  /**
   * Reverts the migration.
   */
  down(): Promise<void>;
}
