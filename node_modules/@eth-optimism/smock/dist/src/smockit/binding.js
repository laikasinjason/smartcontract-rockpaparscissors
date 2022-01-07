"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.unbindSmock = exports.bindSmock = void 0;
const exceptions_1 = require("@nomiclabs/ethereumjs-vm/dist/exceptions");
const bn_js_1 = __importDefault(require("bn.js"));
let decodeRevertReason;
try {
    decodeRevertReason =
        require('hardhat/internal/hardhat-network/stack-traces/revert-reasons').decodeRevertReason;
}
catch (err) {
    const { ReturnData, } = require('hardhat/internal/hardhat-network/provider/return-data');
    decodeRevertReason = (value) => {
        const returnData = new ReturnData(value);
        if (returnData.isErrorReturnData()) {
            return returnData.decodeError();
        }
        else {
            return '';
        }
    };
}
let TransactionExecutionError;
try {
    TransactionExecutionError =
        require('hardhat/internal/hardhat-network/provider/errors').TransactionExecutionError;
}
catch (err) {
    TransactionExecutionError =
        require('hardhat/internal/core/providers/errors').TransactionExecutionError;
}
const common_1 = require("../common");
const isSmockInitialized = (provider) => {
    return provider._node._vm._smockState !== undefined;
};
const initializeSmock = (provider) => {
    if (isSmockInitialized(provider)) {
        return;
    }
    const node = provider._node;
    const vm = node._vm;
    vm._smockState = {
        mocks: {},
        calls: {},
        messages: [],
    };
    vm.on('beforeTx', () => {
        vm._smockState.calls = {};
    });
    vm.on('beforeMessage', (message) => {
        if (!message.to) {
            return;
        }
        let target;
        if (message.delegatecall) {
            target = common_1.fromFancyAddress(message._codeAddress);
        }
        else {
            target = common_1.fromFancyAddress(message.to);
        }
        if (!(target in vm._smockState.mocks)) {
            return;
        }
        if (!(target in vm._smockState.calls)) {
            vm._smockState.calls[target] = [];
        }
        vm._smockState.calls[target].push(message.data);
        vm._smockState.messages.push(message);
    });
    vm.on('afterMessage', async (result) => {
        if (result.createdAddress) {
            const created = common_1.fromFancyAddress(result.createdAddress);
            if (created in vm._smockState.mocks) {
                delete vm._smockState.mocks[created];
            }
        }
        if (vm._smockState.messages.length === 0) {
            return;
        }
        const message = vm._smockState.messages.pop();
        let target;
        if (message.delegatecall) {
            target = common_1.fromFancyAddress(message._codeAddress);
        }
        else {
            target = common_1.fromFancyAddress(message.to);
        }
        if (!(target in vm._smockState.mocks)) {
            return;
        }
        const mock = vm._smockState.mocks[target];
        const { resolve, functionName, rawReturnValue, returnValue, gasUsed } = await mock._smockit(message.data);
        result.gasUsed = new bn_js_1.default(gasUsed);
        result.execResult.returnValue = returnValue;
        result.execResult.gasUsed = new bn_js_1.default(gasUsed);
        result.execResult.exceptionError =
            resolve === 'revert' ? new exceptions_1.VmError('smocked revert') : undefined;
    });
    const originalManagerErrorsFn = node._manageErrors.bind(node);
    node._manageErrors = async (vmResult, vmTrace, vmTracerError) => {
        if (vmResult.exceptionError &&
            vmResult.exceptionError.error === 'smocked revert') {
            return new TransactionExecutionError(`VM Exception while processing transaction: revert ${decodeRevertReason(vmResult.returnValue)}`);
        }
        return originalManagerErrorsFn(vmResult, vmTrace, vmTracerError);
    };
};
const bindSmock = async (mock, provider) => {
    if (!isSmockInitialized(provider)) {
        initializeSmock(provider);
    }
    const vm = provider._node._vm;
    const pStateManager = vm.pStateManager || vm.stateManager;
    vm._smockState.mocks[mock.address.toLowerCase()] = mock;
    await pStateManager.putContractCode(common_1.toFancyAddress(mock.address), Buffer.from('00', 'hex'));
};
exports.bindSmock = bindSmock;
const unbindSmock = async (mock, provider) => {
    if (!isSmockInitialized(provider)) {
        initializeSmock(provider);
    }
    const vm = provider._node._vm;
    const pStateManager = vm.pStateManager || vm.stateManager;
    const address = typeof mock === 'string' ? mock : mock.address.toLowerCase();
    delete vm._smockState.mocks[address];
    await pStateManager.putContractCode(common_1.toFancyAddress(address), Buffer.from('', 'hex'));
};
exports.unbindSmock = unbindSmock;
//# sourceMappingURL=binding.js.map