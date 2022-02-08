// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `npx hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
const { ethers, artifacts } = require("hardhat");
const hre = require("hardhat");

async function main() {
  // Hardhat always runs the compile task when running scripts with its command
  // line interface.
  //
  // If this script is run directly using `node` you may want to call compile
  // manually to make sure everything is compiled
  // await hre.run('compile');

  // We get the contract to deploy
  const daiAddress = '0x6b175474e89094c44da98b954eedeac495271d0f'
  const token = await artifacts.readArtifact("IERC20")
  
  const TestAave = await ethers.getContractFactory("TestAaveFlashLoan")
  const testaave = await TestAave.deploy('0xB53C1a33016B2DC2fF3653530bfF1848a515c8c5')
  await testaave.deployed()
  console.log('Flash deployed at:',testaave.address)
  const signer = await ethers.getSigner()
  console.log(signer.address)
  const dai = await ethers.Contract(daiAddress,token.abi,signer)
  
}
// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
