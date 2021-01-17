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
import "@nomiclabs/hardhat-etherscan";

const { mnemonic, etherscanApiKey } = require('./secrets.json');

task("accounts", "Prints the list of accounts", async (args, hre) => {
  const accounts = await hre.ethers.getSigners();
  for (const account of accounts) {
    console.log(await account.address);
  }
});

const config: HardhatUserConfig = {
	defaultNetwork: "hardhat",
  solidity: {
    compilers: [{
			version: "0.6.12",
			settings: {
				optimizer: {
					enabled: true,
					runs: 200,
				},
			}
		}],
  },
  networks: {
		hardhat: {},
		bsctestnet: {
			url: 'https://data-seed-prebsc-1-s1.binance.org:8545',
      accounts: { mnemonic: mnemonic },
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
	gasReporter: {
    currency: 'EUR',
		gasPrice: 20, // in gwei
		// coinmarketcap: ,
  },
	etherscan: {
		apiKey: etherscanApiKey,
	}
};

export default config;
