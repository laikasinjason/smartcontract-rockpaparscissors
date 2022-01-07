import { MockContract, SmockOptions, SmockSpec } from './types';
export declare const smockit: (spec: SmockSpec, opts?: SmockOptions) => Promise<MockContract>;
export declare const unbind: (mock: MockContract | string) => Promise<void>;
