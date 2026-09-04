import { mkdtemp, mkdir, readdir, rm } from "node:fs/promises";
import { join, resolve, sep } from "node:path";

const repoRoot = join(import.meta.dir, "..");
const packagesRoot = join(repoRoot, "packages");

async function run(command: string[], cwd: string): Promise<void> {
  const process = Bun.spawn(command, { cwd, stdout: "pipe", stderr: "pipe" });
  const [exitCode, stdout, stderr] = await Promise.all([
    process.exited,
    new Response(process.stdout).text(),
    new Response(process.stderr).text(),
  ]);
  if (exitCode !== 0) {
    throw new Error(`${command.join(" ")} failed in ${cwd}\n${stdout}\n${stderr}`);
  }
}

const packageDirectories = (await readdir(packagesRoot, { withFileTypes: true }))
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name)
  .sort();

const requestedOutput = Bun.env.ROKKE_PACKAGE_OUTPUT_DIR;
const persistentTarballsRoot = requestedOutput ? resolve(repoRoot, requestedOutput) : undefined;
if (persistentTarballsRoot && (
  persistentTarballsRoot === repoRoot ||
  !persistentTarballsRoot.startsWith(`${repoRoot}${sep}`)
)) {
  throw new Error("ROKKE_PACKAGE_OUTPUT_DIR must be a directory inside the repository");
}
const validationRoot = await mkdtemp(join(repoRoot, ".rokke-package-validation-"));
const tarballsRoot = persistentTarballsRoot ?? join(validationRoot, "tarballs");
const consumerRoot = join(validationRoot, "consumer");

try {
  await mkdir(tarballsRoot);
  await mkdir(consumerRoot);
  await run(["bun", "run", "build"], repoRoot);

  const dependencies: Record<string, string> = {};
  const imports: string[] = ['import { createServer } from "node:net";'];
  const assertions: string[] = [];

  for (const directory of packageDirectories) {
    const packageRoot = join(packagesRoot, directory);
    const manifest = await Bun.file(join(packageRoot, "package.json")).json() as { name: string };
    const existingTarballs = new Set(await readdir(tarballsRoot));
    await run([
      "bun", "pm", "pack",
      "--destination", tarballsRoot,
      "--ignore-scripts",
      "--quiet",
    ], packageRoot);
    const tarballName = (await readdir(tarballsRoot)).find((name) => !existingTarballs.has(name));
    if (!tarballName) throw new Error(`bun pm pack did not create a tarball for ${manifest.name}`);
    const tarballPath = join(tarballsRoot, tarballName);
    dependencies[manifest.name] = `file:${tarballPath.replaceAll("\\", "/")}`;
    const identifier = directory.replaceAll("-", "_");
    imports.push(`import * as ${identifier} from ${JSON.stringify(manifest.name)};`);
    assertions.push(`if (Object.keys(${identifier}).length === 0) throw new Error(${JSON.stringify(`${manifest.name} has no runtime exports`)});`);
  }

  await Bun.write(join(consumerRoot, "package.json"), JSON.stringify({
    name: "rokke-package-consumer",
    private: true,
    type: "module",
    dependencies,
    overrides: dependencies,
    devDependencies: {
      "@types/bun": "latest",
      "typescript": "^7",
    },
  }, null, 2));
  await Bun.write(join(consumerRoot, "tsconfig.json"), JSON.stringify({
    compilerOptions: {
      lib: ["ESNext", "DOM", "DOM.Iterable"],
      types: ["bun"],
      target: "ESNext",
      module: "Preserve",
      moduleResolution: "bundler",
      strict: true,
      noEmit: true,
      skipLibCheck: false,
    },
    include: ["index.ts"],
  }, null, 2));
  const runtimeValidation = `
function availablePort(): Promise<number> {
  return new Promise((resolve, reject) => {
    const server = createServer();
    server.unref();
    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      if (!address || typeof address === "string") {
        server.close();
        reject(new Error("Could not allocate a test port"));
        return;
      }
      server.close((error) => error ? reject(error) : resolve(address.port));
    });
  });
}

function assertPortReleased(port: number): Promise<void> {
  return new Promise((resolve, reject) => {
    const server = createServer();
    server.unref();
    server.once("error", reject);
    server.listen(port, "127.0.0.1", () => {
      server.close((error) => error ? reject(error) : resolve());
    });
  });
}

const port = await availablePort();
class ConsumerConfigProvider extends core.ServiceProvider {
  override register(container: core.Container): void {
    container.bind(config.ConfigToken, () => ({
      app: { name: "Tarball consumer", env: "development" as const, debug: false },
      http: { port },
      discovery: { controllers: "no-controllers/**/*.ts" },
    }));
  }
}
class ConsumerRouteProvider extends core.ServiceProvider {
  static override readonly dependsOn = [http.HttpProvider];
  override register(container: core.Container): void {
    container.get(http.RouterToken).register({
      method: "GET",
      path: "/consumer",
      handler: async (ctx) => ctx.json({ ok: true }),
    });
  }
}

const app = await core.Application.boot(import.meta.dir)
  .withProviders(ConsumerConfigProvider, http.HttpProvider, ConsumerRouteProvider)
  .create();
await app.start();
const response = await fetch(\`http://127.0.0.1:\${port}/consumer\`);
if (!response.ok || (await response.json() as { ok?: boolean }).ok !== true) {
  throw new Error("Installed tarballs did not serve the consumer request");
}
await app.shutdown();
if (app.state !== "terminated") throw new Error("Installed tarballs did not shut down cleanly");
await assertPortReleased(port);
`;

  await Bun.write(
    join(consumerRoot, "index.ts"),
    `${imports.join("\n")}\n\n${assertions.join("\n")}\n${runtimeValidation}\nconsole.log("validated ${packageDirectories.length} Rokke packages");\n`,
  );

  await run(["bun", "install", "--offline"], consumerRoot);
  await run(["bunx", "tsc", "--noEmit", "-p", "tsconfig.json"], consumerRoot);
  await run(["bun", "run", "index.ts"], consumerRoot);
  console.log(`Validated ${packageDirectories.length} package tarballs in an isolated consumer.`);
  if (persistentTarballsRoot) {
    console.log(`Preserved the validated tarballs in ${persistentTarballsRoot}.`);
  }
} finally {
  await rm(validationRoot, { recursive: true, force: true });
}
