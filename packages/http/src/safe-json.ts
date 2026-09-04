export class SerializationError extends Error {}
export function safeJsonStringify(value: unknown): string {
  if (value === undefined) {
    throw new SerializationError("No se puede serializar `undefined` como valor raíz — RFC 8259 exige un JSON value válido (usar `null` si la intención es esa).");
  }
  return JSON.stringify(value, (_key, v) => {
    if (typeof v === "bigint") {
      throw new SerializationError(`BigInt no es serializable por RFC 8259 — conviértelo a string explícitamente (valor: ${v}).`);
    }
    return v instanceof Date ? v.toISOString() : v;
  });
}
