export interface Cache {
  get<T>(key: string): Promise<T | undefined>;
  set<T>(key: string, value: T, ttlMs?: number): Promise<void>;
  delete(key: string): Promise<void>;
}
export class InMemoryCache implements Cache {
  readonly #store = new Map<string, { value: unknown; expiresAt?: number }>();
  async get<T>(key: string): Promise<T | undefined> {
    const entry = this.#store.get(key);
    if (!entry) return undefined;
    if (entry.expiresAt !== undefined && entry.expiresAt <= Date.now()) {
      this.#store.delete(key);
      return undefined;
    }
    return entry.value as T;
  }
  async set<T>(key: string, value: T, ttlMs?: number): Promise<void> {
    this.#store.set(key, { value, expiresAt: ttlMs !== undefined ? Date.now() + ttlMs : undefined });
  }
  async delete(key: string): Promise<void> {
    this.#store.delete(key);
  }
}
export async function remember<T>(cache: Cache, key: string, ttlMs: number, loader: () => Promise<T>): Promise<T> {
  const cached = await cache.get<T>(key);
  if (cached !== undefined) return cached;
  const value = await loader();
  await cache.set(key, value, ttlMs);
  return value;
}
