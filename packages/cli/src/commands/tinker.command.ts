import { Command } from "../command";
import { createInterface } from "node:readline/promises";
export class TinkerCommand extends Command {
  readonly signature = "tinker";
  readonly description = "REPL interactivo con la Application ya booteada (sin listener HTTP).";
  async handle(ctx: import("../cli-command-context").CliCommandContext): Promise<void> {
    ctx.writeOut("Tinker — `container` disponible. Ctrl+D para salir.\n");
    const container = ctx.container;
    const lines = createInterface({ input: process.stdin, output: process.stdout, terminal: true });
    ctx.onDispose(async () => { lines.close(); });
    for await (const line of lines) {
      try {
        // eslint-disable-next-line no-eval
        const result = eval(line);
        ctx.writeOut(`${Bun.inspect(result)}\n`);
      } catch (error) {
        ctx.writeOut(`Error: ${String(error)}\n`);
      }
    }
  }
}
