"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.toHexString32 = void 0;
const ethers_1 = require("ethers");
const core_utils_1 = require("@eth-optimism/core-utils");
const toHexString32 = (value) => {
    if (typeof value === 'string' && value.startsWith('0x')) {
        if (value.length === 42) {
            return '0x' + core_utils_1.remove0x(value).padStart(64, '0').toLowerCase();
        }
        else {
            return '0x' + core_utils_1.remove0x(value).padEnd(64, '0').toLowerCase();
        }
    }
    else if (typeof value === 'boolean') {
        return '0x' + `${value ? 1 : 0}`.padStart(64, '0');
    }
    else {
        return ('0x' +
            core_utils_1.remove0x(ethers_1.BigNumber.from(value).toHexString())
                .padStart(64, '0')
                .toLowerCase());
    }
};
exports.toHexString32 = toHexString32;
//# sourceMappingURL=hex-utils.js.map