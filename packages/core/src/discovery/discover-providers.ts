import { ServiceProvider } from "../contracts";
import { discoverModules } from "./discover-modules";
type ProviderClass = new (app: import("../contracts").ApplicationContext) => ServiceProvider;
export async function discoverProviderClasses(basePath: string, pattern = "src/**/*.provider.ts"): Promise<ProviderClass[]> {
  const modules = await discoverModules(pattern, basePath);
  const classes: ProviderClass[] = [];
  for (const { exports } of modules) {
    for (const value of Object.values(exports)) {
      if (isServiceProviderClass(value)) classes.push(value);
    }
  }
  return classes;
}
function isServiceProviderClass(value: unknown): value is ProviderClass {
  return typeof value === "function" && value.prototype instanceof ServiceProvider;
}