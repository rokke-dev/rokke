export interface GlobScanOptions {
  readonly cwd: string;
}
export const Glob = {
  async scan(pattern: string, options: GlobScanOptions): Promise<string[]> {
    const glob = new Bun.Glob(pattern);
    const results: string[] = [];
    for await (const file of glob.scan({ cwd: options.cwd })) {
      results.push(file);
    }
    return results.sort();
  },
};
