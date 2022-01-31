//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.7;

import "hardhat/console.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@chainlink/contracts/src/v0.8/VRFConsumerBase.sol";

contract RandomGenerator is Ownable, VRFConsumerBase {
    bytes32 internal keyHash;
    uint256 internal fee;

    uint128 public primeOne;
    uint256 public primeTwo;
    uint256 public primeThree;
    uint128 private RANDOM_NUMBER;
    uint256 private denominator = 3;
    bool public primeNumberSet = false;

    event PrimeSet(bool primeNumberSet);

    /**
     * Constructor inherits VRFConsumerBase
     *
     * Network: Kovan
     * Chainlink VRF Coordinator address: 0xdD3782915140c8f3b190B5D67eAc6dc5760C46E9
     * LINK token address:                0xa36085F69e2889c224210F603D836748e7dC0088
     * Key Hash: 0x6c3699283bda56ad74f6b855546325b68d482e983852a7a82979cc4807b641f4
     */
    constructor()
        VRFConsumerBase(
            0xa555fC018435bef5A13C6c6870a9d4C11DEC329C, // VRF Coordinator
            0x84b9B910527Ad5C03A9Ca831909E21e236EA7b06 // LINK Token
        )
    {
        keyHash = 0xcaf3c3727e033261d383b315559476f48034c13b18f8cafed4d871abe5049186;
        fee = 0.1 * 10**18; // 0.1 LINK (Varies by network)
        uint128 a = 101355962536653984795763843108;
        uint128 b = 101355962536653956209206918388;
        uint256 c = uint256(a) * uint256(b);
        console.log(c);
    }

    function linearCongruential(uint128 _randomness)
        internal
        returns (uint128)
    {
        _randomness = uint128(
            ((uint256(_randomness) * primeOne) + primeTwo) % primeThree
        );
        return _randomness;
    }

    function getRandomNumber() public returns (uint256) {
        require(
            primeNumberSet == true,
            "Prime numbers shoud be set before start betting"
        );

        RANDOM_NUMBER = linearCongruential(RANDOM_NUMBER);
        console.log(RANDOM_NUMBER);
        return RANDOM_NUMBER % denominator;
    }

    /**
     * Requests randomness
     */
    function requestRandomNumber() public returns (bytes32 requestId) {
        require(
            LINK.balanceOf(address(this)) >= fee,
            "Not enough LINK - fill contract with faucet"
        );
        return requestRandomness(keyHash, fee);
    }

    /**
     * Callback function used by VRF Coordinator
     */
    function fulfillRandomness(bytes32 requestId, uint256 randomness)
        internal
        override
    {
        RANDOM_NUMBER = uint128(randomness);
    }

    // PrimeOne will be random 30 digits prime number
    // Cannot change prime numbers after set once
    function setPrimeNumbers(
        uint128 _primeOne,
        uint256 _primeTwo,
        uint256 _primeThree
    ) external onlyOwner {
        require(primeNumberSet == false, "Prime numbers are already set");
        primeOne = _primeOne;
        primeTwo = _primeTwo;
        primeThree = _primeThree;
        primeNumberSet = true;
        emit PrimeSet(primeNumberSet);
    }
}
