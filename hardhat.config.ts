import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import dotenv from "dotenv";

dotenv.config();

const config: HardhatUserConfig = {
  solidity: "0.8.9",
  paths: {
    tests: `./test/${process.env.TEST_DIR}`,
  },
  // If we want gas to be reported.
  // gasReporter: {
  //   currency: "USD",
  //   token: "MATIC",
  //   gasPriceApi:
  //     "https://api.polygonscan.com/api?module=proxy&action=eth_gasPrice",
  //   enabled: true,
  //   coinmarketcap: process.env.COINMARKETCAP_API_KEY,
  // },
};

export default config;
