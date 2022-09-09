import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import dotenv from "dotenv";

dotenv.config();

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.9",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  etherscan: {
    apiKey: process.env.ETHERSCAN_API_KEY,
  },
  paths: {
    tests: `./test/${process.env.TEST_DIR}`,
  },
  networks: {
    mumbay: {
      url: `${process.env.MUMBAI_RPC}`,
      accounts: [`${process.env.DEPLOY_ACCOUNT}`],
    },
    polygon: {
      url: `${process.env.POLYGON_RPC}`,
      accounts: [`${process.env.DEPLOY_ACCOUNT}`],
    },
  },
  // If we want gas to be reported.
  gasReporter: {
    currency: "USD",
    token: "MATIC",
    gasPriceApi:
      "https://api.polygonscan.com/api?module=proxy&action=eth_gasPrice",
    enabled: true,
    coinmarketcap: process.env.COINMARKETCAP_API_KEY,
  },
};

export default config;
