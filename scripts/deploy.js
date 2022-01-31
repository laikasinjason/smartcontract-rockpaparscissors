// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `npx hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
const hre = require("hardhat");
const fs = require("fs");


function loadFile(file) {
  try {
    const privateKey = fs.readFileSync(file, { encoding: 'utf8', flag: 'r' });
    console.log("File data:", privateKey);
    return privateKey;
  } catch (err) {
    console.log(err);
    return;
  }
}

async function main() {
  // Hardhat always runs the compile task when running scripts with its command
  // line interface.
  //
  // If this script is run directly using `node` you may want to call compile
  // manually to make sure everything is compiled
  // await hre.run('compile');

  // We get the contract to deploy

  const RandomGenerator = await hre.ethers.getContractFactory("RandomGenerator");
  const randomGenerator = await RandomGenerator.deploy();

  RPSContract = await ethers.getContractFactory('RPS');
  rps = await RPSContract.deploy(randomGenerator.address, 3600, 5);

  
  await randomGenerator.deployed();
  await rps.deployed();

  await randomGenerator.setPrimeNumbers(BigInt("729716782280841690292116254021"),BigInt("815036628730537114468145564537"),BigInt("686679966517035228021798893831"));

  console.log("randomGenerator deployed to:", randomGenerator.address);
  console.log("rps deployed to:", rps.address);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
