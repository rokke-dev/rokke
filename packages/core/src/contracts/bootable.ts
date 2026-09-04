/**
 * Contract for a bootable entity.
 */
export interface Bootable {
  /**
   * Initializes the entity.
   */
  boot(): void | Promise<void>;
}
