import 'dotenv/config';
import { task } from "hardhat/config";
import { HardhatUserConfig } from "hardhat/types";
import "@nomiclabs/hardhat-waffle";
import "hardhat-typechain";
import "hardhat-spdx-license-identifier";
import "hardhat-preprocessor";
import { removeConsoleLog } from 'hardhat-preprocessor';
import "hardhat-log-remover";
import "solidity-coverage";
import "@nomiclabs/hardhat-solhint";
import "hardhat-gas-reporter";
import 'hardhat-deploy';
import "hardhat-deploy-ethers";
import "@nomiclabs/hardhat-solpp";

let mnemonic = process.env.MNEMONIC;
if (!mnemonic) {
  // FOR DEV ONLY, SET IT IN .env files if you want to keep it private
  // (IT IS IMPORTANT TO HAVE A NON RANDOM MNEMONIC SO THAT SCRIPTS CAN ACT ON THE SAME ACCOUNTS)
  mnemonic = 'test test test test test test test test test test test junk';
}
const accounts = { mnemonic };

task("accounts", "Prints the list of accounts", async (args, hre) => {
  const accounts = await hre.ethers.getSigners();
  for (const account of accounts) {
    console.log(await account.address);
  }
});

const config: HardhatUserConfig = {
  solidity: {
    compilers: [{
			version: "0.8.3",
			settings: {
				optimizer: {
					enabled: true,
					runs: 5000,
				},
			}
		}],
	},
	namedAccounts: {
    deployer: 0,
    user1: 1,
    user2: 2,
  },
  networks: {
		hardhat: {
			accounts
		},
    localhost: {
      url: 'http://localhost:8545',
      accounts,
    },
		bscdevnet: {
			url: 'https://data-seed-prebsc-1-s1.binance.org:8545',
      accounts,
			chainId: 97,
		},
		bsctestnet: {
			url: 'https://data-seed-prebsc-1-s1.binance.org:8545',
      accounts,
			chainId: 97,
		}
	},
	typechain: {
		outDir: 'artifacts/typechain',
		target: 'ethers-v5',
	},
	spdxLicenseIdentifier: {
		overwrite: true,
		runOnCompile: true,
	},
	preprocess: {
    eachLine: removeConsoleLog((bre) => bre.network.name !== 'hardhat' && bre.network.name !== 'localhost'),
	},
	/*
	solpp: {
		noFlatten: false,
		collapseEmptyLines: true,
	},
	*/
	gasReporter: {
    currency: 'EUR',
		gasPrice: 20, // in gwei
		// coinmarketcap: ,
  },
};

export default config;
