"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.fromFancyAddress = exports.toFancyAddress = exports.findBaseHardhatProvider = void 0;
const core_utils_1 = require("@eth-optimism/core-utils");
const findBaseHardhatProvider = (runtime) => {
    const maxLoopIterations = 1024;
    let currentLoopIterations = 0;
    let provider = runtime.network.provider;
    while (provider._wrapped !== undefined) {
        provider = provider._wrapped;
        currentLoopIterations += 1;
        if (currentLoopIterations > maxLoopIterations) {
            throw new Error(`[smock]: unable to find base hardhat provider. are you sure you're running locally?`);
        }
    }
    return provider;
};
exports.findBaseHardhatProvider = findBaseHardhatProvider;
const toFancyAddress = (address) => {
    const fancyAddress = core_utils_1.fromHexString(address);
    fancyAddress.buf = core_utils_1.fromHexString(address);
    fancyAddress.toString = (encoding) => {
        if (encoding === undefined) {
            return address.toLowerCase();
        }
        else {
            return core_utils_1.fromHexString(address).toString(encoding);
        }
    };
    return fancyAddress;
};
exports.toFancyAddress = toFancyAddress;
const fromFancyAddress = (fancyAddress) => {
    if (fancyAddress.buf) {
        return core_utils_1.toHexString(fancyAddress.buf);
    }
    else {
        return core_utils_1.toHexString(fancyAddress);
    }
};
exports.fromFancyAddress = fromFancyAddress;
//# sourceMappingURL=hardhat-common.js.map