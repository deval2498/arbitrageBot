// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `npx hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
const { ethers, artifacts } = require("hardhat");
const hre = require("hardhat");

async function main() {
  const SOLO = '0x4EC3570cADaAEE08Ae384779B0f3A45EF85289DE'
  
  const TestDydx = await ethers.getContractFactory("TestDyDxSoloMargin")
  const testdydx = await TestDydx.deploy(SOLO)
  await testdydx.deployed()
  console.log('Flash deployed at:',testdydx.address)
  console.log("Verify with: npx hardhat verify --network kovan",testdydx.address,SOLO)
}
// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
