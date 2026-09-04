import type { HttpMethod } from "@rokke/core";
(globalThis as any).Symbol.metadata ??= Symbol.for("Symbol.metadata");
export interface RouteMetadataEntry {
  readonly method: HttpMethod;
  readonly path: string;
  readonly propertyKey: string;
}
interface ControllerMetadata {
  controllerBasePath?: string;
  controllerSkipPrefix?: boolean;
  injectable?: boolean;
  routes?: RouteMetadataEntry[];
}
export function Controller(basePath: string, options: { skipPrefix?: boolean } = {}) {
  return function <T extends new (...args: any[]) => object>(_target: T, context: ClassDecoratorContext<T>): void {
    const meta = context.metadata as ControllerMetadata;
    meta.controllerBasePath = basePath;
    meta.controllerSkipPrefix = options.skipPrefix ?? false;
    meta.injectable = true;
  };
}
function createMethodDecorator(method: HttpMethod) {
  return (path: string) => {
    return function (_value: Function, context: ClassMethodDecoratorContext): void {
      const meta = context.metadata as ControllerMetadata;
      meta.routes ??= [];
      meta.routes.push({ method, path, propertyKey: String(context.name) });
    };
  };
}
export const Get = createMethodDecorator("GET");
export const Post = createMethodDecorator("POST");
export const Put = createMethodDecorator("PUT");
export const Patch = createMethodDecorator("PATCH");
export const Delete = createMethodDecorator("DELETE");
export function readControllerMetadata(ctor: Function): ControllerMetadata | undefined {
  const metadata = (ctor as { [Symbol.metadata]?: ControllerMetadata })[Symbol.metadata];
  return metadata?.controllerBasePath !== undefined ? metadata : undefined;
}