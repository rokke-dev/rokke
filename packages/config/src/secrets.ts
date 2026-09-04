import { Env } from "./env";
import { FileSystem } from "@rokke/fs";
export const Secrets = {
  local: {
    async set(key: string, value: string): Promise<void> {
      const secrets = Bun.secrets;
      if (!secrets) throw new Error("Bun.secrets is not available in this version of Bun");
      await secrets.set({ service: "rokke-cli", name: key, value });
    },
    async get(key: string): Promise<string | undefined> {
      const secrets = Bun.secrets;
      if (!secrets) throw new Error("Bun.secrets is not available in this version of Bun");
      const value = await secrets.get({ service: "rokke-cli", name: key });
      return (value ?? undefined) as string | undefined;
    },
  },
  async resolve(key: string): Promise<string> {
    const mountedPath = `/run/secrets/${key}`;
    if (await FileSystem.exists(mountedPath)) {
      return (await FileSystem.file(mountedPath).text()).trim();
    }
    return Env.string(key).required();
  },
};
