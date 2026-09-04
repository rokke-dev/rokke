export class HeaderInjectionError extends Error {
  readonly headerName: string;
  constructor(headerName: string) {
    super(`El valor del header "${headerName}" contiene caracteres no permitidos (CR/LF o control) — posible inyección de headers.`);
    this.headerName = headerName;
    this.name = "HeaderInjectionError";
  }
}
export function assertValidHeaderValue(name: string, value: string): void {
  if (/[\r\n\x00-\x08\x0B\x0C\x0E-\x1F]/.test(value)) throw new HeaderInjectionError(name);
}
