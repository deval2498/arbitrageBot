require("@nomiclabs/hardhat-waffle");
require("@nomiclabs/hardhat-etherscan");
require('dotenv').config()

// This is a sample Hardhat task. To learn how to create your own go to
// https://hardhat.org/guides/create-task.html
task("accounts", "Prints the list of accounts", async (taskArgs, hre) => {
  const accounts = await hre.ethers.getSigners();

  for (const account of accounts) {
    console.log(account.address);
  }
});

const MAINNET_RPC_URL = process.env.MAINNET_RPC_URL
const ACCOUNT = process.env.ACCOUNT
const RINKEBY_RPC_URL = process.env.RINKEBY_RPC_URL
const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY
const KOVAN_RPC_URL = process.env.KOVAN_RPC_URL
module.exports = {
  solidity: {
    compilers: [
      {version : "0.8.4"},{version: "0.4.11"},{version: "0.6.12"},{version: "0.7.0"},{version: "0.4.24"}
    ]
  },
  etherscan: {
    apiKey: ETHERSCAN_API_KEY
  },
  networks: {
    mainnet: {
      chainId: 1,
      url: MAINNET_RPC_URL,
      accounts: [ACCOUNT]
    },
    rinkeby: {
      chainId: 4,
      url: RINKEBY_RPC_URL,
      accounts: [ACCOUNT]
    },
    kovan: {
      url: KOVAN_RPC_URL,
      accounts: [ACCOUNT]
    },
  }
};
