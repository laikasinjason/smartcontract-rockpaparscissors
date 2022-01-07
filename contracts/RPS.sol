//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "hardhat/console.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract RPS is Ownable {
    constructor() {}

    function _compareStrings(string memory a, string memory b)
        private
        view
        returns (bool)
    {
        return (keccak256(abi.encodePacked((a))) ==
            keccak256(abi.encodePacked((b))));
    }

    function _throwDice() private view returns (uint256) {
        return 0;
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

        console.log("[bet] Balance: ", address(this).balance);

        if (_throwDice() == 0) {
            // tie , transfer back money
            console.log("Send back money");
            payable(msg.sender).transfer(msg.value);
        } else if (_throwDice() == 1) {
            // dealer win
        } else {
            // dealer lose, pay double
            payable(msg.sender).transfer(msg.value * 2);
        }
    }

    function addPool() public payable onlyOwner {
        console.log("[Add pool] Balance: ", address(this).balance);
    }
}
