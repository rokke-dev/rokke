export abstract class Migration {
  protected readonly schema: SchemaBuilder;
  constructor(schema: SchemaBuilder) {
    this.schema = schema;
  }
  abstract up(): Promise<void>;
  abstract down(): Promise<void>;
}
export interface ColumnBuilder { primary(): this; notNull(): this; unique(): this; default(value: unknown): this; }
export interface TableBuilder {
  uuid(name: string): ColumnBuilder;
  string(name: string): ColumnBuilder;
  integer(name: string): ColumnBuilder;
  boolean(name: string): ColumnBuilder;
  timestamps(): void;
}
export interface SchemaBuilder {
  createTable(name: string, define: (table: TableBuilder) => void): Promise<void>;
  dropTable(name: string): Promise<void>;
}
