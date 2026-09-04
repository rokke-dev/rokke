import { test, expect, describe, mock } from "bun:test";
import { InMemoryCache, remember } from "../src/cache";
describe("Cache", () => {
  test("remember() no vuelve a llamar loader si el valor sigue en cache", async () => {
    const cache = new InMemoryCache();
    const loader = mock(async () => "foo");
    const r1 = await remember(cache, "k1", 1000, loader);
    const r2 = await remember(cache, "k1", 1000, loader);
    expect(r1).toBe("foo");
    expect(r2).toBe("foo");
    expect(loader).toHaveBeenCalledTimes(1);
  });
  test("un valor con ttlMs vencido se trata como ausente", async () => {
    const cache = new InMemoryCache();
    await cache.set("k1", "foo", 50); 
    await new Promise((r) => setTimeout(r, 60)); 
    const val = await cache.get("k1");
    expect(val).toBeUndefined();
  });
  test("delete() efectivamente lo saca de una llamada get() posterior", async () => {
    const cache = new InMemoryCache();
    await cache.set("k1", "foo");
    await cache.delete("k1");
    const val = await cache.get("k1");
    expect(val).toBeUndefined();
  });
});
