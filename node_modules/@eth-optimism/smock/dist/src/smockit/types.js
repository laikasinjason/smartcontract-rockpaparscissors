"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isArtifact = exports.isContractFactory = exports.isContract = exports.isInterface = exports.isMockContract = void 0;
const isMockFunction = (obj) => {
    return (obj &&
        obj.will &&
        obj.will.return &&
        obj.will.return.with &&
        obj.will.revert &&
        obj.will.revert.with);
};
const isMockContract = (obj) => {
    return (obj &&
        obj.smocked &&
        obj.smocked.fallback &&
        Object.values(obj.smocked).every((smockFunction) => {
            return isMockFunction(smockFunction);
        }));
};
exports.isMockContract = isMockContract;
const isInterface = (obj) => {
    return (obj &&
        obj.functions !== undefined &&
        obj.errors !== undefined &&
        obj.structs !== undefined &&
        obj.events !== undefined &&
        Array.isArray(obj.fragments));
};
exports.isInterface = isInterface;
const isContract = (obj) => {
    return (obj &&
        obj.functions !== undefined &&
        obj.estimateGas !== undefined &&
        obj.callStatic !== undefined);
};
exports.isContract = isContract;
const isContractFactory = (obj) => {
    return obj && obj.interface !== undefined && obj.deploy !== undefined;
};
exports.isContractFactory = isContractFactory;
const isArtifact = (obj) => {
    return (obj &&
        typeof obj._format === 'string' &&
        typeof obj.contractName === 'string' &&
        typeof obj.sourceName === 'string' &&
        Array.isArray(obj.abi) &&
        typeof obj.bytecode === 'string' &&
        typeof obj.deployedBytecode === 'string' &&
        obj.linkReferences &&
        obj.deployedLinkReferences);
};
exports.isArtifact = isArtifact;
//# sourceMappingURL=types.js.map