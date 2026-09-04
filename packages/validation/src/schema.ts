export interface ValidationIssue {
  readonly path: string;
  readonly message: string;
}
export class ValidationException extends Error {
  readonly issues: readonly ValidationIssue[];
  constructor(issues: readonly ValidationIssue[]) {
    super(`Validación falló: ${issues.map((i) => `${i.path}: ${i.message}`).join("; ")}`);
    this.issues = issues;
    this.name = "ValidationException";
  }
}
export interface Schema<T> {
  parse(input: unknown): T;
  safeParse(input: unknown): { success: true; data: T } | { success: false; errors: readonly ValidationIssue[] };
}
