import type { CliCommandContext } from "./cli-command-context";
export abstract class Command {
  abstract readonly signature: string; 
  abstract readonly description: string;
  abstract handle(ctx: CliCommandContext): Promise<void>;
}
