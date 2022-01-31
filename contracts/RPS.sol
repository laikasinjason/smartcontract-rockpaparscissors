//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.7;

import "hardhat/console.sol";
import "./RandomGenerator.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract RPS is Ownable {
    RandomGenerator public randomGenerator;
    uint256 public fomoPool;
    uint256 public lastBetTimestamp;
    uint32 public fomoTimeSecondLimit;
    uint32 public fomoPoolPercentage;

    // event RandomGeneratorCreated(address rGAddress);
    event DealerWin(address playerAddress, uint256 betAmount);
    event Tie(address playerAddress, uint256 betAmount);
    event DealerLoss(address playerAddress, uint256 betAmount);
    event AddPool(uint256 poolAmount);

    /**
     * Constructor inherits VRFConsumerBase
     *
     * Network: Kovan
     * Chainlink VRF Coordinator address: 0xdD3782915140c8f3b190B5D67eAc6dc5760C46E9
     * LINK token address:                0xa36085F69e2889c224210F603D836748e7dC0088
     * Key Hash: 0x6c3699283bda56ad74f6b855546325b68d482e983852a7a82979cc4807b641f4
     */
    constructor(
        RandomGenerator randomGenerator_,
        uint32 fomoTimeSecondLimit_,
        uint32 fomoPoolPercentage_
    ) {
        randomGenerator = randomGenerator_;
        fomoTimeSecondLimit = fomoTimeSecondLimit_;
        fomoPoolPercentage = fomoPoolPercentage_;
    }

    function _compareStrings(string memory a, string memory b)
        private
        pure
        returns (bool)
    {
        return (keccak256(abi.encodePacked((a))) ==
            keccak256(abi.encodePacked((b))));
    }

    function throwDice() public returns (uint256) {
        uint256 result = randomGenerator.getRandomNumber();
        console.log(result);
        return result;
    }

    function _parseBetAction(string memory betAction)
        private
        view
        returns (uint256)
    {
        if (_compareStrings(betAction, "R")) {
            return 0;
        } else if (_compareStrings(betAction, "P")) {
            return 1;
        } else {
            return 2;
        }
    }

    function _getRPSResult(uint256 playerAction, uint256 dealerAction)
        private
        view
        returns (uint256)
    {
        if (playerAction == dealerAction) {
            // tie
            return 0;
        } else if (
            (dealerAction > playerAction) ||
            (dealerAction == 0 && playerAction == 2)
        ) {
            // dealer wins
            return 1;
        } else {
            // player wins
            return 2;
        }
    }

    function bet(string memory betAction) public payable {
        console.log("Betting %s with size %s", betAction, msg.value);
        require(
            _compareStrings(betAction, "R") ||
                _compareStrings(betAction, "P") ||
                _compareStrings(betAction, "S"),
            "Wrong action (Should be R,P,S)"
        );
        require(
            msg.value <= (address(this).balance / 2),
            "Your bet size is too large!"
        );

        if (block.timestamp - lastBetTimestamp >= fomoTimeSecondLimit) {
            if (fomoPool > 0) {
                console.log("Fomo timer finish - send fomo pool %s", fomoPool);
                payable(msg.sender).transfer(fomoPool);
                fomoPool = 0;
            }
        }

        if (msg.value >= (fomoPool * 10) / 100) {
            lastBetTimestamp = block.timestamp;
        }

        console.log("[bet] Balance: %s", address(this).balance);

        uint256 playerAction = _parseBetAction(betAction);
        uint256 dealerAction = throwDice();
        uint256 betResult = _getRPSResult(playerAction, dealerAction);
        if (betResult == 0) {
            // tie , transfer back money
            console.log("Send back money");
            payable(msg.sender).transfer(msg.value);
            emit Tie(msg.sender, msg.value);
        } else if (betResult == 1) {
            // dealer win
            console.log("Dealer win");
            emit DealerWin(msg.sender, msg.value);
        } else {
            // dealer lose, pay double
            uint256 givingBackValue = msg.value * 2;
            uint256 toFomoPool = (givingBackValue * fomoPoolPercentage) / 100;

            givingBackValue -= toFomoPool;
            fomoPool += toFomoPool;

            console.log("Dealer lose [To fomo pool] %s ", toFomoPool);
            payable(msg.sender).transfer(givingBackValue);
            emit DealerLoss(msg.sender, msg.value);
        }
    }

    function addPool() public payable onlyOwner {
        console.log("[Add pool] Balance: ", address(this).balance);
        emit AddPool(msg.value);
    }
}
