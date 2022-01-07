import { HardhatNetworkProvider } from 'hardhat/internal/hardhat-network/provider/provider';
import { MockContract } from './types';
export declare const bindSmock: (mock: MockContract, provider: HardhatNetworkProvider) => Promise<void>;
export declare const unbindSmock: (mock: MockContract | string, provider: HardhatNetworkProvider) => Promise<void>;
