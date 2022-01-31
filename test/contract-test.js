const { expect } = require("chai");
const { ethers } = require("hardhat");
const utils = require('web3-utils');
const { smockit } = require("@eth-optimism/smock");


describe("RPS", function () {

  const provider = ethers.provider;
  before(async function () {
    this.RandomGeneratorContract = await ethers.getContractFactory('RandomGenerator');
    this.RPSContract = await ethers.getContractFactory('RPS');
    this.player = await (await ethers.getSigners())[1];
    this.dealer = await (await ethers.getSigners())[0];
  });

  describe("General test", function () {
    let rps;
    beforeEach(async function () {
      randomGenerator = await this.RandomGeneratorContract.deploy();
      rps = await this.RPSContract.deploy(randomGenerator.address, 0, 0);

      await randomGenerator.setPrimeNumbers(123, 123, 123);
    });

    it("initialize the pool", async function () {
      initBalance = await utils.toNumber(await web3.eth.getBalance(rps.address));
      expect(initBalance).to.equal(0);

      let value_ = utils.toWei('10');
      expect(await rps.addPool({ value: value_ })).to.emit(rps, 'AddPool').withArgs(value_);

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
  });


  describe("Bet", function () {
    let rps;
    beforeEach(async function () {
      // this.randomGenerator = await this.RandomGeneratorContract.attach(await rps.rGAddress());
      randomGenerator = await this.RandomGeneratorContract.deploy();
      this.myMockRandomGenerator = await smockit(randomGenerator);

      this.myMockRandomGenerator.smocked.getRandomNumber.will.return.with(0);
      rps = await this.RPSContract.deploy(this.myMockRandomGenerator.address, 0, 0);
      let value_ = utils.toWei('10');
      await rps.addPool({ value: value_ });
    });

    it("Return same amount when tie", async function () {
      let beforeBalance = await web3.eth.getBalance(this.player.address);
      console.log("before balance: ", beforeBalance);
      let betValue = utils.toWei('1');
      txn = await rps.connect(this.player).bet("R", { value: betValue });
      expect(txn).to.emit(rps, 'Tie').withArgs((await this.player.getAddress()), betValue);
      let afterBalance = await web3.eth.getBalance(this.player.address);
      txnReceipt = await web3.eth.getTransactionReceipt(txn.hash);
      gasUsed = txnReceipt.gasUsed * utils.hexToNumber(txnReceipt.effectiveGasPrice)
      console.log("after balance: ", afterBalance);

      // roughly balance diff
      balanceChange = beforeBalance - gasUsed - afterBalance;
      console.log("diff : ", afterBalance - beforeBalance, gasUsed, balanceChange);
      expect(Math.abs(balanceChange)).to.below(10000000);
      

    });

    it("Get nothing back when lose", async function () {
      let beforeBalance = await web3.eth.getBalance(this.player.address);
      console.log("before balance: ", beforeBalance);
      let betValue = utils.toWei('1');
      txn = await rps.connect(this.player).bet("S", { value: betValue });
      expect(txn).to.emit(rps, 'DealerWin').withArgs((await this.player.getAddress()), betValue);
      let afterBalance = await web3.eth.getBalance(this.player.address);
      txnReceipt = await web3.eth.getTransactionReceipt(txn.hash);
      gasUsed = txnReceipt.gasUsed * utils.hexToNumber(txnReceipt.effectiveGasPrice)
      console.log("after balance: ", afterBalance);

      // roughly balance diff
      balanceChange = beforeBalance - gasUsed - afterBalance;
      console.log("diff : ", afterBalance - beforeBalance, gasUsed, balanceChange);
      betValueInEth = parseFloat(ethers.utils.formatEther(betValue))
      balanceChangeInEth = parseFloat(ethers.utils.formatEther(balanceChange.toString()))
      expect(Math.abs(balanceChangeInEth - betValueInEth)).to.below(0.00000001); // precision tolerance

    });

    it("Get twice amount when win", async function () {
      let beforeBalance = await web3.eth.getBalance(this.player.address);
      console.log("before balance: ", beforeBalance);
      let betValue = utils.toWei('1');
      txn = await rps.connect(this.player).bet("P", { value: betValue });
      expect(txn).to.emit(rps, 'DealerLoss').withArgs((await this.player.getAddress()), betValue);
      let afterBalance = await web3.eth.getBalance(this.player.address);
      txnReceipt = await web3.eth.getTransactionReceipt(txn.hash);
      gasUsed = txnReceipt.gasUsed * utils.hexToNumber(txnReceipt.effectiveGasPrice)
      console.log("after balance: ", afterBalance);

      // roughly balance diff
      balanceChange = beforeBalance - gasUsed - afterBalance;
      console.log("diff : ", afterBalance - beforeBalance, gasUsed, balanceChange);
      betValueInEth = parseFloat(ethers.utils.formatEther(betValue))
      balanceChangeInEth = parseFloat(ethers.utils.formatEther(balanceChange.toString()))
      // balanceChangeInEth should be negative here (winning money)
      expect(Math.abs(balanceChangeInEth + betValueInEth)).to.below(0.00000001); // precision tolerance

    });
  });

  describe("Fomo pool", function () {
    let rps;

    beforeEach(async function () {
      randomGenerator = await this.RandomGeneratorContract.deploy();
      this.myMockRandomGenerator = await smockit(randomGenerator);
      // rps = await this.RPSContract.deploy(randomGenerator.address, 0, 5);

      // let value_ = utils.toWei('10');
      // await rps.addPool({ value: value_ });
    });


    it("5% of that goes into a fomo pool and only getting 95% back when win, other case no fomo pool adding", async function () {
      this.myMockRandomGenerator.smocked.getRandomNumber.will.return.with(0);
      rps = await this.RPSContract.deploy(this.myMockRandomGenerator.address, 100, 5);
      let value_ = utils.toWei('10');
      await rps.addPool({ value: value_ });

      let betValue = utils.toWei('1');


      beforeFomoPool = await rps.fomoPool();
      let beforeBalance = await web3.eth.getBalance(this.player.address);
      console.log("before balance: ", beforeBalance);

      //  win case
      txn = await rps.connect(this.player).bet("P", { value: betValue });
      newFomoPool = await rps.fomoPool();
      let afterBalance = await web3.eth.getBalance(this.player.address);
      console.log("Fomo pool diff: ", newFomoPool - beforeFomoPool);

      expect(newFomoPool - beforeFomoPool).to.equal(100000000000000000);


      txnReceipt = await web3.eth.getTransactionReceipt(txn.hash);
      gasUsed = txnReceipt.gasUsed * utils.hexToNumber(txnReceipt.effectiveGasPrice)
      console.log("after balance: ", afterBalance);

      // roughly balance diff
      balanceChange = beforeBalance - gasUsed - afterBalance;
      console.log("diff : ", afterBalance - beforeBalance, gasUsed, balanceChange);
      betValueInEth = parseFloat(ethers.utils.formatEther(betValue))
      balanceChangeInEth = parseFloat(ethers.utils.formatEther(balanceChange.toString()))
      // balanceChangeInEth should be negative here (winning money)
      expect(Math.abs(balanceChangeInEth + betValueInEth - parseFloat(ethers.utils.formatEther('100000000000000000')))).to.below(0.00000001); // precision tolerance



      // not win case
      beforeFomoPool = await rps.fomoPool();

      txn = await rps.connect(this.player).bet("R", { value: betValue });
      newFomoPool = await rps.fomoPool();
      console.log("HAHA", beforeFomoPool, newFomoPool);
      expect(newFomoPool - beforeFomoPool).to.equal(0);


    });



    it(" last bet timestamp is modified if the bet amount is at least 10% of the pool size and vice versa", async function () {
      await randomGenerator.setPrimeNumbers(123, 123, 123);
      rps = await this.RPSContract.deploy(randomGenerator.address, 100, 5);
      let value_ = utils.toWei('10');
      await rps.addPool({ value: value_ });
      let betValue = utils.toWei('1');

      txn = await rps.connect(this.player).bet("P", { value: betValue });


      // bet with larger then 10 % of pool size
      const beforeTimestamp = await rps.lastBetTimestamp();
      txn = await rps.connect(this.player).bet("P", { value: betValue });
      const newTimestamp = await rps.lastBetTimestamp();

      console.log(beforeTimestamp, newTimestamp);

      expect(newTimestamp).to.not.equal(beforeTimestamp);



      // bet with smaller then 10 % of pool size
      const beforeTimestamp2 = await rps.lastBetTimestamp();
      let betValue2 = utils.toWei('0.00001');
      txn = await rps.connect(this.player).bet("P", { value: betValue2 });
      const newTimestamp2 = await rps.lastBetTimestamp();

      console.log(beforeTimestamp2, newTimestamp2);

      expect(newTimestamp2).to.equal(beforeTimestamp2);

    });

    function delay(time) {
      return new Promise(resolve => setTimeout(resolve, time));
    }

    it("fomo timer goes to zero, the last bettor that either turned on or extended the timer wins all the amount in the fomo pool", async function () {
      this.myMockRandomGenerator.smocked.getRandomNumber.will.return.with(0);
      rps = await this.RPSContract.deploy(this.myMockRandomGenerator.address, 1, 5);// 1 second timer
      let value_ = utils.toWei('10');
      await rps.addPool({ value: value_ });
      let betValue = utils.toWei('1');

      txn = await rps.connect(this.player).bet("P", { value: betValue });
      newFomoPool = await rps.fomoPool();
      expect(newFomoPool).to.equal("100000000000000000");
      await delay(1000);


      let beforeBalance = await web3.eth.getBalance(this.player.address);
      console.log("before balance: ", beforeBalance);
      txn = await rps.connect(this.player).bet("R", { value: betValue });
      let afterBalance = await web3.eth.getBalance(this.player.address);
      txnReceipt = await web3.eth.getTransactionReceipt(txn.hash);
      gasUsed = txnReceipt.gasUsed * utils.hexToNumber(txnReceipt.effectiveGasPrice)
      console.log("after balance: ", afterBalance);

      newFomoPool = await rps.fomoPool();
      expect(newFomoPool).to.equal(0);

      // even tie, he still get the fomo money
      balanceChange = beforeBalance - gasUsed - afterBalance;
      balanceChangeInEth = parseFloat(ethers.utils.formatEther(balanceChange.toString()))
      console.log("diff : ", afterBalance - beforeBalance, gasUsed, balanceChange);
      expect(Math.abs(balanceChangeInEth + parseFloat(ethers.utils.formatEther("100000000000000000")))).to.below(0.00000001);
    });

  });
});

