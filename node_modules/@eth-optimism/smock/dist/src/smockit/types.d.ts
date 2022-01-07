/// <reference types="node" />
import { Artifact } from 'hardhat/types';
import { Contract, ContractFactory, ethers } from 'ethers';
import { Signer } from '@ethersproject/abstract-signer';
import { Provider } from '@ethersproject/abstract-provider';
import { JsonFragment, Fragment } from '@ethersproject/abi';
export declare type SmockSpec = Artifact | Contract | ContractFactory | ethers.utils.Interface | string | (JsonFragment | Fragment | string)[];
export interface SmockOptions {
    provider?: Provider;
    address?: string;
}
export declare type MockReturnValue = string | Object | any[] | ((...params: any[]) => MockReturnValue);
export interface MockContractFunction {
    calls: any[];
    reset: () => void;
    will: {
        return: {
            (): void;
            with: (returnValue?: MockReturnValue) => void;
        };
        revert: {
            (): void;
            with: (revertValue?: string | (() => string) | (() => Promise<string>)) => void;
        };
        resolve: 'return' | 'revert';
    };
}
export declare type MockContract = Contract & {
    smocked: {
        [name: string]: MockContractFunction;
    };
    wallet: Signer;
};
export interface SmockedVM {
    _smockState: {
        mocks: {
            [address: string]: MockContract;
        };
        calls: {
            [address: string]: any[];
        };
        messages: any[];
    };
    on: (event: string, callback: Function) => void;
    stateManager?: {
        putContractCode: (address: Buffer, code: Buffer) => Promise<void>;
    };
    pStateManager?: {
        putContractCode: (address: Buffer, code: Buffer) => Promise<void>;
    };
}
export declare const isMockContract: (obj: any) => obj is MockContract;
export declare const isInterface: (obj: any) => boolean;
export declare const isContract: (obj: any) => boolean;
export declare const isContractFactory: (obj: any) => boolean;
export declare const isArtifact: (obj: any) => obj is Artifact;
