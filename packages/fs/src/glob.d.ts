export interface GlobScanOptions {
    readonly cwd: string;
}
export declare const Glob: {
    scan(pattern: string, options: GlobScanOptions): Promise<string[]>;
};
