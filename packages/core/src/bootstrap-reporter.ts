export const bootstrapReporter = {
  warn(message: string): void {
    console.warn(`[Bootstrap] WARN: ${message}`);
  },
  error(message: string, error: unknown): void {
    console.error(`[Bootstrap] ERROR: ${message}`, error);
  },
};
