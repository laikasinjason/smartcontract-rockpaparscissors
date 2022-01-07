/// <reference types="node" />
import { BigNumber } from 'ethers';
export declare const TxGasPrice: BigNumber;
export interface EncodableL2GasLimit {
    data: Buffer | string;
    l1GasPrice: BigNumber | number;
    l2GasLimit: BigNumber | number;
    l2GasPrice: BigNumber | number;
}
export declare const TxGasLimit: {
    encode: (input: EncodableL2GasLimit) => BigNumber;
    decode: (fee: BigNumber | number) => BigNumber;
};
export declare const ceilmod: (a: BigNumber | number, b: BigNumber | number) => BigNumber;
export declare const calculateL1GasLimit: (data: string | Buffer) => BigNumber;
export declare const zeroesAndOnes: (data: Buffer | string) => Array<number>;
