export type ColumnType = "string" | "number" | "boolean" | "decimal" | "date" | "json";
/** "decimal" mapea a string en TS — NUMERIC/DECIMAL de Postgres vuelve como string, nunca number (§2.1). */
export type ColumnTsType<K extends ColumnType> =
  K extends "string" ? string : K extends "number" ? number : K extends "boolean" ? boolean :
  K extends "decimal" ? string : K extends "date" ? Date : K extends "json" ? unknown : never;
export interface ColumnOptions { readonly type?: ColumnType; readonly nullable?: boolean; }
interface EntityMetadata {
  tableName?: string;
  primaryKey?: string;
  columns?: Array<{ propertyKey: string; type: ColumnType; nullable: boolean }>;
  relations?: Array<{ propertyKey: string; kind: "hasMany"; target: () => Function; foreignKey: string }>;
}
(globalThis as any).Symbol.metadata ??= Symbol.for("Symbol.metadata");
export function Entity(tableName: string) {
  return function <T extends new (...args: any[]) => object>(_target: T, context: ClassDecoratorContext<T>): void {
    const meta = context.metadata as EntityMetadata;
    meta.tableName = tableName;
  };
}
export function Column(options: ColumnOptions = {}) {
  return function (_value: undefined, context: ClassFieldDecoratorContext): void {
    const meta = context.metadata as EntityMetadata;
    meta.columns ??= [];
    meta.columns.push({ propertyKey: String(context.name), type: options.type ?? "string", nullable: options.nullable ?? false });
  };
}
export function PrimaryKey() {
  return function (_value: undefined, context: ClassFieldDecoratorContext): void {
    const meta = context.metadata as EntityMetadata;
    meta.primaryKey = String(context.name);
  };
}
export function HasMany(target: () => Function, foreignKey: string) {
  return function (_value: undefined, context: ClassFieldDecoratorContext): void {
    const meta = context.metadata as EntityMetadata;
    meta.relations ??= [];
    meta.relations.push({ propertyKey: String(context.name), kind: "hasMany", target, foreignKey });
  };
}
export function readEntityMetadata(ctor: Function): EntityMetadata | undefined {
  const metadata = (ctor as { [Symbol.metadata]?: EntityMetadata })[Symbol.metadata];
  return metadata?.tableName !== undefined ? metadata : undefined;
}
