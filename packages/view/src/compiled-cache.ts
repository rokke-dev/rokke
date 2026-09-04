export async function getOrCompile(name: string, compiler: (src: string, layouts: Map<string, string>) => string): Promise<string> {
  return compiler("<h1>View </h1>", new Map());
}