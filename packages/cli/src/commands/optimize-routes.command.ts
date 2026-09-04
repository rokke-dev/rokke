import { Command } from "../command";
import { discoverProviderClasses } from "@rokke/core";
import { FileSystem } from "@rokke/fs";

export class OptimizeRoutesCommand extends Command {
  readonly signature = "optimize:routes";
  readonly description = "Genera un manifest experimental de providers; no usar en producción.";

  async handle(ctx: import("../cli-command-context").CliCommandContext): Promise<void> {
    const basePath = ctx.app.basePath;
    const providerClasses = await discoverProviderClasses(basePath);
    const manifest = `export const providerModules = ${JSON.stringify(providerClasses.map((p) => p.name))};\n`;
    await FileSystem.write(`${basePath}/routes.manifest.ts`, manifest);
    ctx.writeOut(`Manifest generado: routes.manifest.ts (${providerClasses.length} providers)\n`);
  }
}
