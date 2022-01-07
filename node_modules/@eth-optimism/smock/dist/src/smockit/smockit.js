"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.unbind = exports.smockit = void 0;
const hardhat_1 = __importDefault(require("hardhat"));
const ethers_1 = require("ethers");
const core_utils_1 = require("@eth-optimism/core-utils");
const types_1 = require("./types");
const binding_1 = require("./binding");
const utils_1 = require("../utils");
const common_1 = require("../common");
const makeContractInterfaceFromSpec = async (spec) => {
    if (spec instanceof ethers_1.Contract) {
        return spec.interface;
    }
    else if (spec instanceof ethers_1.ContractFactory) {
        return spec.interface;
    }
    else if (spec instanceof ethers_1.ethers.utils.Interface) {
        return spec;
    }
    else if (types_1.isInterface(spec)) {
        return spec;
    }
    else if (types_1.isContractFactory(spec)) {
        return spec.interface;
    }
    else if (types_1.isContract(spec)) {
        return spec.interface;
    }
    else if (types_1.isArtifact(spec)) {
        return new ethers_1.ethers.utils.Interface(spec.abi);
    }
    else if (typeof spec === 'string') {
        try {
            return new ethers_1.ethers.utils.Interface(spec);
        }
        catch (err) {
            return (await hardhat_1.default.ethers.getContractFactory(spec)).interface;
        }
    }
    else {
        return new ethers_1.ethers.utils.Interface(spec);
    }
};
const smockifyFunction = (contract, functionName, vm) => {
    return {
        reset: () => {
            return;
        },
        get calls() {
            return (vm._smockState.calls[contract.address.toLowerCase()] || [])
                .map((calldataBuf) => {
                const sighash = core_utils_1.toHexString(calldataBuf.slice(0, 4));
                const fragment = contract.interface.getFunction(sighash);
                let data = core_utils_1.toHexString(calldataBuf);
                try {
                    data = contract.interface.decodeFunctionData(fragment.format(), data);
                }
                catch (e) {
                    console.error(e);
                }
                return {
                    functionName: fragment.name,
                    functionSignature: fragment.format(),
                    data,
                };
            })
                .filter((functionResult) => {
                return (functionResult.functionName === functionName ||
                    functionResult.functionSignature === functionName);
            })
                .map((functionResult) => {
                return functionResult.data;
            });
        },
        will: {
            get return() {
                const fn = () => {
                    this.resolve = 'return';
                    this.returnValue = undefined;
                };
                fn.with = (returnValue) => {
                    this.resolve = 'return';
                    this.returnValue = returnValue;
                };
                return fn;
            },
            get revert() {
                const fn = () => {
                    this.resolve = 'revert';
                    this.returnValue = undefined;
                };
                fn.with = (revertValue) => {
                    this.resolve = 'revert';
                    this.returnValue = revertValue;
                };
                return fn;
            },
            resolve: 'return',
        },
    };
};
const smockit = async (spec, opts = {}) => {
    if (hardhat_1.default.network.name !== 'hardhat') {
        throw new Error(`[smock]: smock is only compatible with the "hardhat" network, got: ${hardhat_1.default.network.name}`);
    }
    const provider = common_1.findBaseHardhatProvider(hardhat_1.default);
    if (provider._node === undefined) {
        await provider._init();
    }
    const contract = new ethers_1.ethers.Contract(opts.address || utils_1.makeRandomAddress(), await makeContractInterfaceFromSpec(spec), opts.provider || hardhat_1.default.ethers.provider);
    await hardhat_1.default.network.provider.request({
        method: 'hardhat_impersonateAccount',
        params: [contract.address],
    });
    contract.wallet = await hardhat_1.default.ethers.getSigner(contract.address);
    contract.smocked = {
        fallback: smockifyFunction(contract, 'fallback', provider._node._vm),
    };
    for (const functionName of Object.keys(contract.functions)) {
        contract.smocked[functionName] = smockifyFunction(contract, functionName, provider._node._vm);
    }
    ;
    contract._smockit = async function (data) {
        var _a, _b, _c;
        let fn;
        try {
            const sighash = core_utils_1.toHexString(data.slice(0, 4));
            fn = this.interface.getFunction(sighash);
        }
        catch (err) {
            fn = null;
        }
        let params;
        let mockFn;
        if (fn !== null) {
            params = this.interface.decodeFunctionData(fn, core_utils_1.toHexString(data));
            mockFn = this.smocked[fn.name] || this.smocked[fn.format()];
        }
        else {
            params = core_utils_1.toHexString(data);
            mockFn = this.smocked.fallback;
        }
        const rawReturnValue = ((_a = mockFn.will) === null || _a === void 0 ? void 0 : _a.returnValue) instanceof Function
            ? await mockFn.will.returnValue(...params)
            : mockFn.will.returnValue;
        let encodedReturnValue = '0x';
        if (rawReturnValue !== undefined) {
            if (((_b = mockFn.will) === null || _b === void 0 ? void 0 : _b.resolve) === 'revert') {
                if (typeof rawReturnValue !== 'string') {
                    throw new Error(`Smock: Tried to revert with a non-string (or non-bytes) type: ${typeof rawReturnValue}`);
                }
                if (rawReturnValue.startsWith('0x')) {
                    encodedReturnValue = rawReturnValue;
                }
                else {
                    const errorface = new ethers_1.ethers.utils.Interface([
                        {
                            inputs: [
                                {
                                    name: '_reason',
                                    type: 'string',
                                },
                            ],
                            name: 'Error',
                            outputs: [],
                            stateMutability: 'nonpayable',
                            type: 'function',
                        },
                    ]);
                    encodedReturnValue = errorface.encodeFunctionData('Error', [
                        rawReturnValue,
                    ]);
                }
            }
            else {
                if (fn === null) {
                    encodedReturnValue = rawReturnValue;
                }
                else {
                    try {
                        encodedReturnValue = this.interface.encodeFunctionResult(fn, [
                            rawReturnValue,
                        ]);
                    }
                    catch (err) {
                        if (err.code === 'INVALID_ARGUMENT') {
                            try {
                                encodedReturnValue = this.interface.encodeFunctionResult(fn, rawReturnValue);
                            }
                            catch (_d) {
                                if (typeof rawReturnValue !== 'string') {
                                    throw new Error(`Could not properly encode mock return value for ${fn.name}`);
                                }
                                encodedReturnValue = rawReturnValue;
                            }
                        }
                        else {
                            throw err;
                        }
                    }
                }
            }
        }
        else {
            if (fn === null) {
                encodedReturnValue = '0x';
            }
            else {
                encodedReturnValue = '0x' + '00'.repeat(2048);
            }
        }
        return {
            resolve: (_c = mockFn.will) === null || _c === void 0 ? void 0 : _c.resolve,
            functionName: fn ? fn.name : null,
            rawReturnValue,
            returnValue: core_utils_1.fromHexString(encodedReturnValue),
            gasUsed: mockFn.gasUsed || 0,
        };
    };
    await binding_1.bindSmock(contract, provider);
    return contract;
};
exports.smockit = smockit;
const unbind = async (mock) => {
    if (hardhat_1.default.network.name !== 'hardhat') {
        throw new Error(`[smock]: smock is only compatible with the "hardhat" network, got: ${hardhat_1.default.network.name}`);
    }
    const provider = common_1.findBaseHardhatProvider(hardhat_1.default);
    await binding_1.unbindSmock(mock, provider);
};
exports.unbind = unbind;
//# sourceMappingURL=smockit.js.map