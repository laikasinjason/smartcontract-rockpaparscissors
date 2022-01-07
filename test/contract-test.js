const { expect } = require("chai");
const { ethers } = require("hardhat");
const utils = require('web3-utils');
const { smockit } = require("@eth-optimism/smock");


describe("RPS", function () {
  let rps;
  const provider = ethers.provider;

  before(async function () {
    this.RPSContract = await ethers.getContractFactory('RPS');
    this.player = await (await ethers.getSigners())[1];
    this.dealer = await (await ethers.getSigners())[0];
  });
  beforeEach(async function () {
    rps = await this.RPSContract.deploy();
  });

  it("initialize the pool", async function () {
    initBalance = await utils.toNumber(await web3.eth.getBalance(rps.address));
    expect(initBalance).to.equal(0);

    let value_ = utils.toWei('10');
    await rps.addPool({ value: value_ });

    afterBalance = await web3.eth.getBalance(rps.address);
    console.log(afterBalance);
    expect(afterBalance).to.equal(value_);
  });

  it("non owner cannot add pool", async function () {
    let value_ = utils.toWei('10');
    await expect(rps.connect(this.player).addPool({ value: value_ })).to.be.revertedWith("Ownable: caller is not the owner");
  });

  describe("Reject case", function () {

    it("Accept only R,P,S for bet action", async function () {
      await expect(rps.bet("ABC")).to.be.revertedWith("Wrong action (Should be R,P,S)");


      await rps.bet("R");
      await rps.bet("P");
      await rps.bet("S");
    });


    it("Reject if amount larger than half of dealer", async function () {

      let value_ = utils.toWei('10');
      await rps.addPool({ value: value_ });

      let betValue = utils.toWei('12');
      await expect(rps.connect(this.player).bet("R", { value: betValue })).to.be.revertedWith("Your bet size is too large!");

      let betValue2 = utils.toWei('10');
      await rps.connect(this.player).bet("R", { value: betValue2 });
    });
  });


  describe("Bet", function () {
    beforeEach(async function () {
      let value_ = utils.toWei('10');
      await rps.addPool({ value: value_ });
    });

    // it("Get nothing back when lose", async function () {
    //   const MyMockRPSContract = await smockit(rps);
    //   // const myMockRPS = await this.RPSContract.deploy();
    //   MyMockRPSContract.smocked._throwDice.will.return.with(0);

    //   let beforeBalance = await web3.eth.getBalance(this.player.address);
    //   console.log("before balance: ", beforeBalance);
    //   let betValue = utils.toWei('1');
    //   txn = await rps.connect(this.player).bet("R", { value: betValue });
    //   let afterBalance = await web3.eth.getBalance(this.player.address);
    //   txnReceipt = await web3.eth.getTransactionReceipt(txn.hash);
    //   gasUsed = txnReceipt.gasUsed * utils.hexToNumber(txnReceipt.effectiveGasPrice)
    //   console.log("after balance: ", afterBalance);

    //   // roughly balance diff
    //   balanceChange = beforeBalance - gasUsed - afterBalance;
    //   console.log("diff : ", afterBalance - beforeBalance, gasUsed, balanceChange);
    //   expect(balanceChange).to.equal(0);
      
    // });

    // it("Get twice amount when win", async function () {
    // });

    // it("Return same amount when tie", async function () {
    // });
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
});

