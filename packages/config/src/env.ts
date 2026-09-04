export class EnvError extends Error {
  public readonly key: string;
  public readonly reason: string;
  constructor(key: string, reason: string) {
    super(`Variable de entorno "${key}": ${reason}`);
    this.name = "EnvError";
    this.key = key;
    this.reason = reason;
  }
}
function readRaw(key: string): string | undefined {
  const value = Bun.env[key];
  return value === "" ? undefined : value;
}
class EnvStringBuilder {
  private readonly key: string;
  constructor(key: string) { this.key = key; }
  required(): string {
    const raw = readRaw(this.key);
    if (raw === undefined) throw new EnvError(this.key, "es requerida y no está definida");
    return raw;
  }
  default(fallback: string): string {
    return readRaw(this.key) ?? fallback;
  }
  optional(): string | undefined {
    return readRaw(this.key);
  }
}
class EnvNumberBuilder {
  private readonly key: string;
  constructor(key: string) { this.key = key; }
  required(): number { return this.#parse(new EnvStringBuilder(this.key).required()); }
  default(fallback: number): number {
    const raw = new EnvStringBuilder(this.key).optional();
    return raw === undefined ? fallback : this.#parse(raw);
  }
  #parse(raw: string): number {
    const n = Number(raw);
    if (Number.isNaN(n)) throw new EnvError(this.key, `no es un número válido: "${raw}"`);
    return n;
  }
}
class EnvBooleanBuilder {
  private readonly key: string;
  constructor(key: string) { this.key = key; }
  required(): boolean { return this.#parse(new EnvStringBuilder(this.key).required()); }
  default(fallback: boolean): boolean {
    const raw = new EnvStringBuilder(this.key).optional();
    return raw === undefined ? fallback : this.#parse(raw);
  }
  #parse(raw: string): boolean {
    if (raw === "true" || raw === "1") return true;
    if (raw === "false" || raw === "0") return false;
    throw new EnvError(this.key, `no es un booleano válido: "${raw}" (usar "true"/"false"/"1"/"0")`);
  }
}
class EnvEnumBuilder<T extends string> {
  private readonly key: string;
  private readonly allowed: readonly T[];
  constructor(key: string, allowed: readonly T[]) {
    this.key = key;
    this.allowed = allowed;
  }
  required(): T { return this.#parse(new EnvStringBuilder(this.key).required()); }
  default(fallback: T): T {
    const raw = new EnvStringBuilder(this.key).optional();
    return raw === undefined ? fallback : this.#parse(raw);
  }
  #parse(raw: string): T {
    if (!this.allowed.includes(raw as T)) {
      throw new EnvError(this.key, `debe ser uno de [${this.allowed.join(", ")}], recibió "${raw}"`);
    }
    return raw as T;
  }
}
export const Env = {
  string: (key: string) => new EnvStringBuilder(key),
  number: (key: string) => new EnvNumberBuilder(key),
  boolean: (key: string) => new EnvBooleanBuilder(key),
  enum: <T extends string>(key: string, allowed: readonly T[]) => new EnvEnumBuilder(key, allowed),
};
