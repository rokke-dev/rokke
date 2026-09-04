export class UnsafeIdentifierError extends Error {
  readonly identifier: string;
  constructor(identifier: string) {
    super(`"${identifier}" no es un identificador SQL válido — posible intento de inyección por fuera del sistema de tipos.`);
    this.name = "UnsafeIdentifierError";
    this.identifier = identifier;
  }
}
export function quoteIdentifier(name: string): string {
  if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(name)) throw new UnsafeIdentifierError(name);
  return `"${name}"`;
}
