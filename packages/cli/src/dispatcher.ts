import type { ApplicationContext } from "@rokke/core";
import type { Command } from "./command";
import { CliCommandContext } from "./cli-command-context";
interface ParsedSignature {
  readonly name: string;
  readonly positional: readonly { name: string; required: boolean }[];
}
export function parseSignature(signature: string): ParsedSignature {
  const [name, ...rest] = signature.split(" ");
  const positional = rest.map((token) => ({
    name: token.replace(/[<>[\]]/g, ""),
    required: token.startsWith("<"),
  }));
  return { name: name!, positional };
}
export async function dispatch(app: ApplicationContext, argv: readonly string[], commands: readonly Command[]): Promise<void> {
  const [commandName, ...args] = argv;
  const command = commands.find((c) => parseSignature(c.signature).name === commandName);
  if (!command) throw new UnknownCommandError(commandName ?? "");
  const { positional } = parseSignature(command.signature);
  const requiredCount = positional.filter((p) => p.required).length;
  if (args.length < requiredCount) throw new MissingArgumentError(command.signature, positional[args.length]!.name);
  await using ctx = new CliCommandContext(app, args);
  await command.handle(ctx);
}
export class UnknownCommandError extends Error {
  constructor(name: string) { super(`Comando desconocido: "${name}".`); this.name = "UnknownCommandError"; }
}
export class MissingArgumentError extends Error {
  public readonly signature: string;
  public readonly argument: string;
  constructor(signature: string, argument: string) {
    super(`Falta el argumento requerido "${argument}" para "${signature}".`);
    this.name = "MissingArgumentError";
    this.signature = signature;
    this.argument = argument;
  }
}
