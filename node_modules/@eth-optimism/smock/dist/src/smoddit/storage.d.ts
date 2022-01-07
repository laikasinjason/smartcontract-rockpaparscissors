interface StorageSlot {
    label: string;
    hash: string;
    value: string;
}
export declare const getStorageLayout: (name: string) => Promise<any>;
export declare const getStorageSlots: (storageLayout: any, obj: any) => StorageSlot[];
export {};
