const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("RPS", function () {
  describe("Bet", function () {
    it("Accept int amount as bet value", async function () {
      const Greeter = await ethers.getContractFactory("Greeter");
      const greeter = await Greeter.deploy("Hello, world!");
      await greeter.deployed();

      expect(await greeter.greet()).to.equal("Hello, world!");

      const setGreetingTx = await greeter.setGreeting("Hola, mundo!");

      // wait until the transaction is mined
      await setGreetingTx.wait();

      expect(await greeter.greet()).to.equal("Hola, mundo!");
    });

    it("Reject if amount larger than half of dealer", async function () {
    });

    it("Get nothing back when lose", async function () {
    });

    it("Get twice amount when win", async function () {
    });

    it("Return same amount when tie", async function () {
    });
  });

  describe("Fomo pool", function () {

    it("5% of that goes into a fomo pool", async function () {
    });

    it(" timer is started and set to end at 1 hour from bet placement time", async function () {
    });

    it("extend the timer to 1 hour from the bet placement time if the bet amount is at least 10% of the pool size", async function () {

    });
    it("fomo timer goes to zero, the last bettor that either turned on or extended the timer wins all the amount in the fomo pool", async function () {

    });

  });