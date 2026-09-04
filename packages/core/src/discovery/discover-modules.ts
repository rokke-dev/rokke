import { Glob } from "@rokke/fs";
export interface DiscoveredModule {
  readonly filePath: string;
  readonly exports: Record<string, unknown>;
}
export async function discoverModules(pattern: string, basePath: string): Promise<DiscoveredModule[]> {
  const files = await Glob.scan(pattern, { cwd: basePath });
  const modules: DiscoveredModule[] = [];
  for (const filePath of files) {
    const exports = await import(basePath + "/" + filePath);
    modules.push({ filePath, exports });
  }
  return modules;
}