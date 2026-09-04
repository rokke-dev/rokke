import { ServiceProvider, type Container } from "@rokke/core";
import { ConfigProvider, ConfigToken } from "@rokke/config";
import type { RequestProfile } from "./request-profile";
export class DevtoolsMustNotRunInProductionError extends Error {
  constructor() {
    super('"@rokke/devtools" no puede cargarse con app.env: "production" — es una herramienta de desarrollo, no un componente de servidor.');
    this.name = "DevtoolsMustNotRunInProductionError";
  }
}
export class DevtoolsProvider extends ServiceProvider {
  static override readonly dependsOn = [ConfigProvider];
  #profiles = new Map<string, RequestProfile>();
  override register(container: Container): void {
    const config = this.app.container.get(ConfigToken);
    if (config.app.env === "production") throw new DevtoolsMustNotRunInProductionError();
  }
  recordProfile(profile: RequestProfile): void {
    this.#profiles.set(profile.correlationId, profile);
    if (this.#profiles.size > 100) {
      const oldest = this.#profiles.keys().next().value;
      if (oldest) this.#profiles.delete(oldest);
    }
  }
  getProfile(correlationId: string): RequestProfile | undefined {
    return this.#profiles.get(correlationId);
  }
}
