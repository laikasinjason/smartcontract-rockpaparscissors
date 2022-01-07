"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.smoddit = void 0;
const hardhat_1 = __importDefault(require("hardhat"));
const core_utils_1 = require("@eth-optimism/core-utils");
const storage_1 = require("./storage");
const utils_1 = require("../utils");
const common_1 = require("../common");
const smoddit = async (name, signer) => {
    const provider = common_1.findBaseHardhatProvider(hardhat_1.default);
    if (provider._node === undefined) {
        await provider._init();
    }
    const vm = provider._node._vm;
    const pStateManager = vm.pStateManager || vm.stateManager;
    const layout = await storage_1.getStorageLayout(name);
    const factory = (await hardhat_1.default.ethers.getContractFactory(name, signer));
    const originalDeployFn = factory.deploy.bind(factory);
    factory.deploy = async (...args) => {
        const contract = await originalDeployFn(...args);
        contract._smodded = {};
        const put = async (storage) => {
            if (!storage) {
                return;
            }
            const slots = storage_1.getStorageSlots(layout, storage);
            for (const slot of slots) {
                await pStateManager.putContractStorage(common_1.toFancyAddress(contract.address), core_utils_1.fromHexString(slot.hash.toLowerCase()), core_utils_1.fromHexString(slot.value));
            }
        };
        const check = async (storage) => {
            if (!storage) {
                return true;
            }
            const slots = storage_1.getStorageSlots(layout, storage);
            for (const slot of slots) {
                if (utils_1.toHexString32(await pStateManager.getContractStorage(common_1.toFancyAddress(contract.address), core_utils_1.fromHexString(slot.hash.toLowerCase()))) !== slot.value) {
                    return false;
                }
            }
            return true;
        };
        contract.smodify = {
            put,
            check,
        };
        return contract;
    };
    return factory;
};
exports.smoddit = smoddit;
//# sourceMappingURL=smoddit.js.map