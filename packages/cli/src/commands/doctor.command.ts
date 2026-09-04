import { Command } from "../command";
export class DoctorCommand extends Command {
  readonly signature = "doctor";
  readonly description = "Ejecuta los health checks de los providers iniciados.";
  async handle(ctx: import("../cli-command-context").CliCommandContext): Promise<void> {
    const providers = ctx.app.getBootedProviders();
    for (const provider of providers) {
      if (!provider.healthCheck) continue;
      const result = await provider.healthCheck();
      ctx.writeOut(`${provider.constructor.name}: ${result.status}${result.detail ? ` (${result.detail})` : ""}\n`);
    }
  }
}
