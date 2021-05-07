import 'dotenv/config';
import { task } from "hardhat/config";
import { HardhatUserConfig } from "hardhat/types";
import "@nomiclabs/hardhat-waffle";
import '@typechain/hardhat';
import 'hardhat-dependency-compiler';
import "hardhat-spdx-license-identifier";
import "hardhat-preprocessor";
import { removeConsoleLog } from 'hardhat-preprocessor';
import "hardhat-log-remover";
import "solidity-coverage";
import "@nomiclabs/hardhat-solhint";
import "hardhat-gas-reporter";
import "@nomiclabs/hardhat-etherscan";
import "@openzeppelin/hardhat-upgrades";
import "@tenderly/hardhat-tenderly";

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
		compilers: [
      {
        version: "0.8.4",
				settings: {
					metadata: {
						bytecodeHash: "none"
					},
					optimizer: {
						enabled: true,
						runs: 5000
					},
					outputSelection: {
						"*": {
							"*": ["metadata"]
						}
					}
				},
      },
      {
        version: "0.6.12",
        settings: {
					optimizer: {
						enabled: true,
						runs: 200
					},
				}
      },
			{
        version: "0.5.16",
        settings: {
					optimizer: {
						enabled: true,
						runs: 200
					},
				}
      }
    ],
		overrides: {
      "@pancakeswap/pancake-swap-lib/contracts/math/SafeMath.sol": {
        version: "0.6.12"
      },
			"@pancakeswap/pancake-swap-lib/contracts/token/BEP20/IBEP20.sol": {
        version: "0.6.12"
      },
			"@pancakeswap/pancake-swap-lib/contracts/token/BEP20/SafeBEP20.sol": {
        version: "0.6.12"
      },
			"@pancakeswap/pancake-swap-lib/contracts/access/Ownable.sol": {
        version: "0.6.12"
      },
			"@pancakeswap/pancake-swap-lib/contracts/utils/Address.sol": {
        version: "0.6.12"
      },
			"@pancakeswap/pancake-swap-lib/contracts/GSN/Context.sol": {
        version: "0.6.12"
      }
    }
	},
  networks: {
		hardhat: {
			accounts
		},
		/*
		hardhat: {
			chainId: 123,
			throwOnCallFailures: false
		},
		*/
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
	dependencyCompiler: {
		paths: [
			'ApeSwap-Banana-Farm/contracts/BEP20RewardApeV2.sol',
			'ApeSwap-Banana-Farm/contracts/libs/MockBEP20.sol',
			'ApeSwap-Core-Contracts/contracts/ApeFactory.sol',
		],
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
    // Your API key for Etherscan
    // Obtain one at https://etherscan.io/
    apiKey: process.env.BSC_SCAN_API_KEY
  }
};

export default config;
