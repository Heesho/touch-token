const { config } = require("dotenv");

require("@nomiclabs/hardhat-waffle");
require("@nomicfoundation/hardhat-verify");
require("solidity-coverage");

/*===================================================================*/
/*===========================  SETTINGS  ============================*/

const CHAIN_ID = 84532; // Base Sepolia

/*===========================  END SETTINGS  ========================*/
/*===================================================================*/

config();
const PRIVATE_KEY = process.env.PRIVATE_KEY || "";
const SCAN_API_KEY = process.env.SCAN_API_KEY || "";
const RPC_URL = process.env.RPC_URL || "";

// This is a sample Hardhat task. To learn how to create your own go to
// https://hardhat.org/guides/create-task.html
task("accounts", "Prints the list of accounts", async (taskArgs, hre) => {
  const accounts = await hre.ethers.getSigners();

  for (const account of accounts) {
    console.log(account.address);
  }
});

/**
 * @type import('hardhat/config').HardhatUserConfig
 */

module.exports = {
  solidity: {
    version: "0.8.23",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  networks: {
    mainnet: {
      url: RPC_URL,
      chainId: CHAIN_ID,
      accounts: [PRIVATE_KEY],
    },
    hardhat: {},
  },
  etherscan: {
    apiKey: SCAN_API_KEY,
    customChains: [
      {
        network: "base-sepolia",
        chainId: 84532,
        urls: {
          apiURL: "https://api-sepolia.basescan.org/api",
          browserURL: "https://sepolia.basescan.org/",
        },
      },
    ],
  },
  paths: {
    sources: "./contracts",
    tests: "./tests",
    cache: "./cache",
    artifacts: "./artifacts",
  },
  mocha: {
    timeout: 300000,
  },
};
