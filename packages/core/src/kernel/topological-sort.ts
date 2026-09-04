import type { ServiceProvider } from "../contracts";
import { ProviderDependencyCycleError } from "../contracts";
export function topologicalSort(providers: readonly ServiceProvider[]): ServiceProvider[] {
  const byCtor = new Map<Function, ServiceProvider>(providers.map((p) => [p.constructor, p]));
  const inDegree = new Map<Function, number>(providers.map((p) => [p.constructor, 0]));
  const dependents = new Map<Function, Function[]>(providers.map((p) => [p.constructor, []]));
  for (const provider of providers) {
    const deps = ((provider.constructor as any).dependsOn as ReadonlyArray<Function> | undefined) ?? [];
    for (const dep of deps) {
      if (!byCtor.has(dep)) continue;
      inDegree.set(provider.constructor, (inDegree.get(provider.constructor) ?? 0) + 1);
      dependents.get(dep)!.push(provider.constructor);
    }
  }
  const queue = providers.filter((p) => inDegree.get(p.constructor) === 0).map((p) => p.constructor);
  const result: ServiceProvider[] = [];
  while (queue.length > 0) {
    const ctor = queue.shift()!;
    result.push(byCtor.get(ctor)!);
    for (const dependent of dependents.get(ctor) ?? []) {
      const newDegree = (inDegree.get(dependent) ?? 0) - 1;
      inDegree.set(dependent, newDegree);
      if (newDegree === 0) queue.push(dependent);
    }
  }
  if (result.length !== providers.length) {
    const unresolved = providers.filter((p) => !result.includes(p)).map((p) => p.constructor);
    throw new ProviderDependencyCycleError(unresolved);
  }
  return result;
}
