export interface FileReference {
    readonly path: string;
    readonly size: number;
    readonly type: string;
    text(): Promise<string>;
    arrayBuffer(): Promise<ArrayBuffer>;
    stream(): ReadableStream<Uint8Array>;
}
export declare const FileSystem: {
    file(path: string): FileReference;
    write(path: string, content: string | ArrayBuffer | Blob): Promise<void>;
    exists(path: string): Promise<boolean>;
    delete(path: string): Promise<void>;
    dirname(path: string): string;
};
