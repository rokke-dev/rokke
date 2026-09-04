import { ServiceProvider, token, type Container } from "@rokke/core";
import { Glob } from "@rokke/fs";
import { Env } from "./env";
import type { AppConfig } from "./app-config";
export const ConfigToken = token<AppConfig>("Config");
export class ConfigNotReadyError extends Error {
  constructor() {
    super(
      "ConfigToken se resolvió antes de que ConfigProvider.boot() terminara. " +
      "¿El provider que lo pidió olvidó declarar `static dependsOn = [ConfigProvider]`?",
    );
    this.name = "ConfigNotReadyError";
  }
}
export class ConfigProvider extends ServiceProvider {
  #config: AppConfig | undefined;
  override register(container: Container): void {
    container.bind(ConfigToken, () => {
      if (!this.#config) throw new ConfigNotReadyError();
      return this.#config;
    }, "singleton");
  }
  override async boot(): Promise<void> {
    const fileDefaults = await this.#loadConfigFiles();
    this.#config = this.#applyEnvOverrides(fileDefaults);
  }
  async #loadConfigFiles(): Promise<Partial<AppConfig>> {
    const files = await Glob.scan("config/*.ts", { cwd: this.app.basePath });
    let merged: Partial<AppConfig> = {};
    for (const file of files) {
      const module = await import(`${this.app.basePath}/${file}`);
      merged = this.#deepMerge(merged, module.default as Partial<AppConfig>);
    }
    return merged;
  }
  #applyEnvOverrides(base: Partial<AppConfig>): AppConfig {
    return {
      ...base,
      app: {
        name: base.app?.name ?? "App",
        env: Env.enum("APP_ENV", ["development", "staging", "production"] as const).default(base.app?.env ?? "development"),
        debug: Env.boolean("APP_DEBUG").default(base.app?.debug ?? false),
      },
    } as AppConfig;
  }
  #deepMerge(a: Partial<AppConfig>, b: Partial<AppConfig>): Partial<AppConfig> {
    return { ...a, ...b };
  }
}
export function defineConfig<T extends Partial<AppConfig>>(shape: T): T {
  return shape;
}
