import { Command } from "../command";
export class DevCommand extends Command {
  readonly signature = "dev";
  readonly description = "Servidor de desarrollo con recarga automática.";
  async handle(ctx: import("../cli-command-context").CliCommandContext): Promise<void> {
    const proc = Bun.spawn(["bun", "--watch", "src/index.ts"], {
      cwd: ctx.app.basePath,
      stdio: ["inherit", "inherit", "inherit"],
    });
    ctx.onDispose(async () => { proc.kill(); });
    await proc.exited;
  }
}
