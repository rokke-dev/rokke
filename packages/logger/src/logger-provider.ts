import { ServiceProvider, token, type Container } from "@rokke/core";
import { ConfigProvider, ConfigToken } from "@rokke/config";
import { FrameworkLogger } from "./framework-logger";
import { ConsoleTransport } from "./transports/console-transport";
import { JsonTransport } from "./transports/json-transport";
import type { Logger } from "./logger";
import type { LogTransport } from "./log-transport";
import type { LogLevel } from "./log-entry";
export const LoggerToken = token<Logger>("Logger");
export class LoggerProvider extends ServiceProvider {
  static override readonly dependsOn = [ConfigProvider];
  override register(container: Container): void {
    container.bind(LoggerToken, (c) => {
      const config = c.get(ConfigToken);
      const transports: LogTransport[] = config.app.env === "production"
        ? [new JsonTransport()]
        : [new ConsoleTransport()];
      const minLevel: LogLevel = config.app.debug ? "debug" : "info";
      return new FrameworkLogger(transports, "default", minLevel);
    }, "singleton");
  }
}
