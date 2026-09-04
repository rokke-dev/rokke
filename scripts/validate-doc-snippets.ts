import { mkdtemp, readdir, rm } from "node:fs/promises";
import { basename, dirname, join } from "node:path";

const repoRoot = join(import.meta.dir, "..");
const validationRoot = await mkdtemp(join(repoRoot, ".rokke-doc-validation-"));

async function run(command: string[], cwd: string): Promise<void> {
  const process = Bun.spawn(command, { cwd, stdout: "pipe", stderr: "pipe" });
  const [exitCode, stdout, stderr] = await Promise.all([
    process.exited,
    new Response(process.stdout).text(),
    new Response(process.stderr).text(),
  ]);
  if (exitCode !== 0) throw new Error(`${command.join(" ")} failed\n${stdout}\n${stderr}`);
}

try {
  const packageNames = (await readdir(join(repoRoot, "packages"), { withFileTypes: true }))
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();
  const readmes = [
    join(repoRoot, "README.md"),
    join(repoRoot, "example", "README.md"),
    ...packageNames.map((name) => join(repoRoot, "packages", name, "README.md")),
  ];
  let snippetCount = 0;
  for (const readme of readmes) {
    const markdown = await Bun.file(readme).text();
    const snippets = markdown.matchAll(/```ts\r?\n([\s\S]*?)```/g);
    for (const match of snippets) {
      snippetCount += 1;
      const sourceName = `${String(snippetCount).padStart(2, "0")}-${basename(dirname(readme))}.ts`;
      await Bun.write(join(validationRoot, sourceName), `${match[1]}\n`);
    }
  }
  if (snippetCount === 0) throw new Error("No TypeScript documentation snippets were found");

  await Bun.write(join(validationRoot, "tsconfig.json"), JSON.stringify({
    compilerOptions: {
      lib: ["ESNext", "DOM", "DOM.Iterable"],
      types: ["bun"],
      target: "ESNext",
      module: "Preserve",
      moduleResolution: "bundler",
      paths: Object.fromEntries(packageNames.map((name) => [`@rokke/${name}`, [`../packages/${name}/index.ts`]])),
      strict: true,
      noEmit: true,
      skipLibCheck: true,
    },
    include: ["*.ts"],
  }, null, 2));

  await run(["bunx", "tsc", "--noEmit", "-p", "tsconfig.json"], validationRoot);
  console.log(`Validated ${snippetCount} TypeScript documentation snippets.`);
} finally {
  await rm(validationRoot, { recursive: true, force: true });
}
