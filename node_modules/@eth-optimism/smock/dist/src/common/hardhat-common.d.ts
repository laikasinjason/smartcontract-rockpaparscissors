import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { HardhatNetworkProvider } from 'hardhat/internal/hardhat-network/provider/provider';
export declare const findBaseHardhatProvider: (runtime: HardhatRuntimeEnvironment) => HardhatNetworkProvider;
export declare const toFancyAddress: (address: string) => any;
export declare const fromFancyAddress: (fancyAddress: any) => string;
