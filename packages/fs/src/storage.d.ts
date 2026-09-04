import { type FileReference } from "./file-system";
export interface Storage {
    write(path: string, content: ReadableStream<Uint8Array> | ArrayBuffer | string): Promise<void>;
    append(path: string, content: string): Promise<void>;
    read(path: string): FileReference;
    exists(path: string): Promise<boolean>;
    delete(path: string): Promise<void>;
}
export declare class LocalStorage implements Storage {
    #private;
    private readonly root;
    constructor(root: string);
    write(path: string, content: ReadableStream<Uint8Array> | ArrayBuffer | string): Promise<void>;
    append(path: string, content: string): Promise<void>;
    read(path: string): FileReference;
    exists(path: string): Promise<boolean>;
    delete(path: string): Promise<void>;
}
