"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getStorageSlots = exports.getStorageLayout = void 0;
const hardhat_1 = __importDefault(require("hardhat"));
const artifacts_1 = require("hardhat/internal/artifacts");
const ethers_1 = require("ethers");
const core_utils_1 = require("@eth-optimism/core-utils");
const lodash_1 = __importDefault(require("lodash"));
const utils_1 = require("../utils");
const getStorageLayout = async (name) => {
    const artifacts = new artifacts_1.Artifacts(hardhat_1.default.config.paths.artifacts);
    const { sourceName, contractName } = artifacts.readArtifactSync(name);
    const buildInfo = await hardhat_1.default.artifacts.getBuildInfo(`${sourceName}:${contractName}`);
    const output = buildInfo.output.contracts[sourceName][contractName];
    if (!('storageLayout' in output)) {
        throw new Error(`Storage layout for ${name} not found. Did you forget to set the storage layout compiler option in your hardhat config? Read more: https://github.com/ethereum-optimism/smock#note-on-using-smoddit`);
    }
    return output.storageLayout;
};
exports.getStorageLayout = getStorageLayout;
const getStorageSlots = (storageLayout, obj) => {
    const slots = [];
    const flat = flattenObject(obj);
    for (const key of Object.keys(flat)) {
        const path = key.split('.');
        const variableLabel = path[0];
        const variableDef = storageLayout.storage.find((vDef) => {
            return vDef.label === variableLabel;
        });
        if (!variableDef) {
            throw new Error(`Could not find a matching variable definition for ${variableLabel}`);
        }
        const baseSlot = parseInt(variableDef.slot, 10);
        const baseDepth = (variableDef.type.match(/t_mapping/g) || []).length;
        const slotLabel = path.length > 1 + baseDepth ? path[path.length - 1] : 'default';
        const inputSlot = getInputSlots(storageLayout, variableDef.type).find((iSlot) => {
            return iSlot.label === slotLabel;
        });
        if (!inputSlot) {
            throw new Error(`Could not find a matching slot definition for ${slotLabel}`);
        }
        let slotHash = utils_1.toHexString32(baseSlot);
        for (let i = 0; i < baseDepth; i++) {
            slotHash = ethers_1.ethers.utils.keccak256(utils_1.toHexString32(path[i + 1]) + core_utils_1.remove0x(slotHash));
        }
        slotHash = utils_1.toHexString32(ethers_1.ethers.BigNumber.from(slotHash).add(inputSlot.slot));
        const slotValue = utils_1.toHexString32(`0x` + utils_1.toHexString32(flat[key]).slice(2 + variableDef.offset * 2));
        slots.push({
            label: key,
            hash: slotHash,
            value: slotValue,
        });
    }
    return slots;
};
exports.getStorageSlots = getStorageSlots;
const flattenObject = (obj, prefix = '', res = {}) => {
    if (ethers_1.ethers.BigNumber.isBigNumber(obj)) {
        res[prefix] = obj.toNumber();
        return res;
    }
    else if (lodash_1.default.isString(obj) || lodash_1.default.isNumber(obj) || lodash_1.default.isBoolean(obj)) {
        res[prefix] = obj;
        return res;
    }
    else if (lodash_1.default.isArray(obj)) {
        for (let i = 0; i < obj.length; i++) {
            const pre = lodash_1.default.isEmpty(prefix) ? `${i}` : `${prefix}.${i}`;
            flattenObject(obj[i], pre, res);
        }
        return res;
    }
    else if (lodash_1.default.isPlainObject(obj)) {
        for (const key of Object.keys(obj)) {
            const pre = lodash_1.default.isEmpty(prefix) ? key : `${prefix}.${key}`;
            flattenObject(obj[key], pre, res);
        }
        return res;
    }
    else {
        throw new Error('Cannot flatten unsupported object type.');
    }
};
const getInputSlots = (storageLayout, inputTypeName) => {
    const inputType = storageLayout.types[inputTypeName];
    if (inputType.encoding === 'mapping') {
        return getInputSlots(storageLayout, inputType.value);
    }
    else if (inputType.encoding === 'inplace') {
        if (inputType.members) {
            return inputType.members.map((member) => {
                return {
                    label: member.label,
                    slot: member.slot,
                };
            });
        }
        else {
            return [
                {
                    label: 'default',
                    slot: 0,
                },
            ];
        }
    }
    else {
        throw new Error(`Encoding type not supported: ${inputType.encoding}`);
    }
};
//# sourceMappingURL=storage.js.map