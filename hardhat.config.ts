import 'dotenv/config';
import { task, types } from "hardhat/config";
import { HardhatUserConfig } from "hardhat/types";
import "@nomiclabs/hardhat-waffle";
import '@typechain/hardhat';
import 'hardhat-dependency-compiler';
import "hardhat-spdx-license-identifier";
import "solidity-coverage";
import "@nomiclabs/hardhat-solhint";
// import "hardhat-gas-reporter";
import "@nomiclabs/hardhat-etherscan";
import "@openzeppelin/hardhat-upgrades";
import {
  hashBytecodeWithoutMetadata,
  Manifest,
} from "@openzeppelin/upgrades-core";
// import "hardhat-abi-exporter";

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

task("wban:deploy", "Deploy wBAN")
	.setAction(async (args, hre) => {
		const accounts = await hre.ethers.getSigners();
		console.info(`Deploying wBAN with owner "${accounts[0].address}"`);

		// deploy upgradeable contract
		const WBANToken = await hre.ethers.getContractFactory("WBANToken");
		const wban = await hre.upgrades.deployProxy(WBANToken);
		await wban.deployed();
		console.log(`wBAN proxy deployed at: "${wban.address}"`);

		// peer into OpenZeppelin manifest to extract the implementation address
		const ozUpgradesManifestClient = await Manifest.forNetwork(hre.network.provider);
		const manifest = await ozUpgradesManifestClient.read();
		const bytecodeHash = hashBytecodeWithoutMetadata(WBANToken.bytecode);
		const implementationContract = manifest.impls[bytecodeHash];

		// verify implementation contract
		if (implementationContract) {
			console.log(`wBAN impl deployed at: "${implementationContract.address}"`);
			await hre.run("verify:verify", {
				address: implementationContract.address
			});
		}
	});

task("wban:verify", "Verify wBAN source code on blockchain explorer")
	.setAction(async (args, hre) => {
		const WBANToken = await hre.ethers.getContractFactory("WBANTokenWithPermit");

		// peer into OpenZeppelin manifest to extract the implementation address
		const ozUpgradesManifestClient = await Manifest.forNetwork(hre.network.provider);
		const manifest = await ozUpgradesManifestClient.read();
		const bytecodeHash = hashBytecodeWithoutMetadata(WBANToken.bytecode);
		const implementationContract = manifest.impls[bytecodeHash];

		// verify implementation contract
		if (implementationContract) {
			console.log(`wBAN impl deployed at: "${implementationContract.address}"`);
			await hre.run("verify:verify", {
				address: implementationContract.address
			});
		}
	});

task("wban:upgrade", "Upgrade wBAN")
	.addParam("contract", "The smart-contract address", '', types.string)
	.setAction(async (args, hre) => {
		const accounts = await hre.ethers.getSigners();
		console.info(`Upgrading wBAN from owner "${accounts[0].address}"`)

		// deploy upgradeable contract
		const WBANToken = await hre.ethers.getContractFactory("WBANToken");
		const wban = WBANToken.attach(args.contract);
		await hre.upgrades.upgradeProxy(wban, WBANToken);

		// peer into OpenZeppelin manifest to extract the implementation address
		const ozUpgradesManifestClient = await Manifest.forNetwork(hre.network.provider);
		const manifest = await ozUpgradesManifestClient.read();
		const bytecodeHash = hashBytecodeWithoutMetadata(WBANToken.bytecode);
		const implementationContract = manifest.impls[bytecodeHash];

		// verify implementation contract
		if (implementationContract) {
			console.log(`wBAN impl deployed at: "${implementationContract.address}"`);
			await hre.run("verify:verify", {
				address: implementationContract.address
			});
		}
	});

task("wban:deploy-permit", "Deploy wBAN with permit feature")
	.setAction(async (args, hre) => {
		const accounts = await hre.ethers.getSigners();
		console.info(`Deploying wBAN with owner "${accounts[0].address}"`);

		// deploy upgradeable contract
		const WBANTokenWithPermit = await hre.ethers.getContractFactory("WBANTokenWithPermit");
		const wban = await hre.upgrades.deployProxy(WBANTokenWithPermit);
		await wban.deployed();
		console.log(`wBAN proxy deployed at: "${wban.address}"`);

		// peer into OpenZeppelin manifest to extract the implementation address
		const ozUpgradesManifestClient = await Manifest.forNetwork(hre.network.provider);
		const manifest = await ozUpgradesManifestClient.read();
		const bytecodeHash = hashBytecodeWithoutMetadata(WBANTokenWithPermit.bytecode);
		const implementationContract = manifest.impls[bytecodeHash];

		// verify implementation contract
		if (implementationContract) {
			console.log(`wBAN impl deployed at: "${implementationContract.address}"`);
			await hre.run("verify:verify", {
				address: implementationContract.address
			});
		}
	});

task("wban:upgrade-permit", "Upgrade wBAN to enable permit feature")
	.addParam("contract", "The smart-contract address", '', types.string)
	.setAction(async (args, hre) => {
		const accounts = await hre.ethers.getSigners();
		console.info(`Upgrading wBAN with permit feature from owner "${accounts[0].address}"`)

		// deploy upgradeable contract
		const WBANToken = await hre.ethers.getContractFactory("WBANTokenWithPermit");
		const wban = WBANToken.attach(args.contract);
		await hre.upgrades.upgradeProxy(wban, WBANToken, { call: "initializeWithPermit" });

		// peer into OpenZeppelin manifest to extract the implementation address
		const ozUpgradesManifestClient = await Manifest.forNetwork(hre.network.provider);
		const manifest = await ozUpgradesManifestClient.read();
		const bytecodeHash = hashBytecodeWithoutMetadata(WBANToken.bytecode);
		const implementationContract = manifest.impls[bytecodeHash];

		// verify implementation contract
		if (implementationContract) {
			console.log(`wBAN upgraded with permit feature, deployed at: "${implementationContract.address}"`);
			await hre.run("verify:verify", {
				address: implementationContract.address
			});
		}
	});

task("wban:pause", "Pause wBAN -- [EMERGENCY ONLY]")
	.addParam("wban", "The address of wBAN smart-contract", '', types.string)
	.setAction(async (args, hre) => {
		const wbanAddress = args.wban;
		const wban = await hre.ethers.getContractAt("WBANToken", wbanAddress)
		await wban.pause()
	});

task("wban:gasless-swap", "Deploy wBAN gasless swap contract")
	.addParam("wban", "The address of wBAN smart-contract", '0xe20B9e246db5a0d21BF9209E4858Bc9A3ff7A034', types.string)
	.addParam("swapTarget", "The address of 0x exchange proxy", '', types.string)
	.addParam("relayer", "The address of the relayer allowed to call this the gasless swap contract", '', types.string)
	.setAction(async (args, hre) => {
		const accounts = await hre.ethers.getSigners()
		const wbanAddress = args.wban
		const swapTarget = args.swapTarget
		const relayerAddress = args.relayer

		console.info(`Deploying wBAN gasless swap with owner "${accounts[0].address}"`)
		const gaslessSwapFactory = await hre.ethers.getContractFactory("WBANGaslessSwap")
		const swap = (await hre.upgrades.deployProxy(gaslessSwapFactory, [wbanAddress, swapTarget]))
		await swap.deployed()
		await swap.grantRole(await swap.RELAYER_ROLE(), relayerAddress)
		console.log(`wBAN gasless swap proxy deployed at: "${swap.address}"`)

		// peer into OpenZeppelin manifest to extract the implementation address
		const ozUpgradesManifestClient = await Manifest.forNetwork(hre.network.provider)
		const manifest = await ozUpgradesManifestClient.read()
		const bytecodeHash = hashBytecodeWithoutMetadata(gaslessSwapFactory.bytecode)
		const implementationContract = manifest.impls[bytecodeHash]

		// verify implementation contract
		if (implementationContract) {
			console.log(`wBAN gasless swap impl deployed at: "${implementationContract.address}"`)
			await hre.run("verify:verify", {
				address: implementationContract.address
			})
		}
	});

task("benis:deploy", "Deploy Benis (with permit feature)")
	.addParam("wban", "The address of wBAN smart-contract", '0xe20B9e246db5a0d21BF9209E4858Bc9A3ff7A034', types.string)
	.addParam("rewards", "The number of wBAN to reward per second", 1, types.float)
	.addParam("starttime", "The timestamp at which Benis farms should start", 0, types.int)
	.addParam("rewarder", "The address of the wBAN rewarder", "0xD7eB548715FdC282d237Dd826b1A99d86bfec79c", types.string)
	.setAction(async (args, hre) => {
		const wbanAddress = args.wban;
		const rewardsPerSecond = hre.ethers.utils.parseEther(args.rewards.toString());
		let rewardsStartTime = args.starttime == 0 ? (await hre.ethers.provider.getBlock('latest')).timestamp : args.starttime;
		const rewarderAddress = args.rewarder;
		const Benis = await hre.ethers.getContractFactory("BenisWithPermit");
		const benis = await Benis.deploy(wbanAddress, rewardsPerSecond, rewardsStartTime, rewarderAddress);
		await benis.deployed();
		await hre.run("verify:verify", {
			address: benis.address,
			constructorArguments: [
				wbanAddress,
				rewardsPerSecond,
				rewardsStartTime,
				rewarderAddress,
			]
		});
		console.log(`Benis deployed and verified at "${benis.address}" with rewardsPerSecond ${rewardsPerSecond.toString()} and startTime ${rewardsStartTime}`);
	});

task("benis:verify", "Verify Benis source code on blockchain explorer")
	.addParam("benis", "The address of Benis smart-contract", '', types.string)
	.addParam("wban", "The address of wBAN smart-contract", '', types.string)
	.addParam("rewards", "The number of wBAN to reward per second", 1, types.float)
	.addParam("starttime", "The timestamp at which Benis farms should start", 0, types.int)
	.addParam("rewarder", "The address of the wBAN rewarder", "", types.string)
	.setAction(async (args, hre) => {
		const benisAddress = args.benis;
		const rewardsPerSecond = hre.ethers.utils.parseEther(args.rewards.toString());
		let rewardsStartTime = args.starttime == 0 ? (await hre.ethers.provider.getBlock('latest')).timestamp : args.starttime;
		const rewarderAddress = args.rewarder;
		console.log(`Benis deployed at: "${benisAddress}"`);
		await hre.run("verify:verify", {
			address: benisAddress,
  		constructorArguments: [
				args.wban,
				rewardsPerSecond,
				rewardsStartTime,
				rewarderAddress,
			]
		});
	});

task("benis:add-time", "Deploy Benis")
	.addParam("benis", "The address of Benis smart-contract", '', types.string)
	.addParam("time", "Number of seconds to extends Benis end time to", 1, types.int)
	.setAction(async (args, hre) => {
		const benisAddress = args.benis;
		const additionalTime = args.time;
		const benis = await hre.ethers.getContractAt("Benis", benisAddress)
		const tx = await benis.changeEndTime(additionalTime)
		console.info('Tx hash:', tx.hash)
	});

task("benis:change-rewards", "Changes Benis rewards per second")
	.addParam("benis", "The address of Benis smart-contract", '', types.string)
	.addParam("rewards", "The number of wBAN to reward per second", 1, types.float)
	.setAction(async (args, hre) => {
		const benisAddress = args.benis;
		const rewardsPerSecond = hre.ethers.utils.parseEther(args.rewards.toString());
		console.log(`Rewards per second: ${hre.ethers.utils.formatEther(rewardsPerSecond)}`);
		const benis = await hre.ethers.getContractAt("Benis", benisAddress);
		await benis.setWBANPerSecond(rewardsPerSecond, true);
	});

task("benis:alloc-pool", "Change allocation points")
	.addParam("benis", "The address of Benis smart-contract", '', types.string)
	.addParam("pid", "The pool ID", 0, types.int)
	.addParam("alloc", "Number of seconds to extends Benis end time to", 1, types.int)
	.setAction(async (args, hre) => {
		const benisAddress = args.benis;
		const pid = args.pid;
		const alloc = args.alloc;
		const benis = await hre.ethers.getContractAt("Benis", benisAddress);
		await benis.set(pid, alloc, true, { gasLimit: 300_000 });
	});

task("benis:create-pool", "Create a farm")
	.addParam("benis", "The address of Benis smart-contract", '', types.string)
	.addParam("lp", "The address of the LP token or wBAN", '', types.string)
	.addParam("alloc", "The allocation points for this pool", 1000, types.int)
	.setAction(async (args, hre) => {
		const benisAddress = args.benis;
		const lpTokenAddress = args.lp;
		const alloc = args.alloc;
		const benis = await hre.ethers.getContractAt("Benis", benisAddress)
		const tx = await benis.add(alloc, lpTokenAddress, true);
		console.info('Tx hash:', tx.hash);
		await tx.wait();
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
				version: "0.6.6",
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
		ethereum: {
			url: "https://rpc.ankr.com/eth",
			accounts,
			chainId: 1,
			timeout: 600_000, // 10 minutes
		},
		rinkeby: {
			url: "https://rinkeby.infura.io/v3/2b0e677e7a214cc9855fa34e2e1f682e",
			accounts,
			//gasMultiplier: 2,
		},
		ropsten: {
			url: "https://rpc.ankr.com/eth_ropsten",
			accounts,
			chainId: 3,
		},
		goerli: {
			url: "https://rpc.ankr.com/eth_goerli",
			accounts,
			chainId: 5,
			gasMultiplier: 1.1,
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
		},
		bsc: {
			url: 'https://bsc-dataseed.binance.org/',
			accounts,
			chainId: 56,
		},
		/*
		polygontestnet: {
			url: 'https://rpc-mumbai.maticvigil.com',
			accounts,
			chainId: 80001,
		},
		*/
		polygontestnet: {
			url: 'https://matic-mumbai.chainstacklabs.com',
			accounts,
			chainId: 80001,
			gasMultiplier: 1.5,
			gasPrice: 50000000000,
		},
		polygon: {
			url: 'https://polygon-rpc.com',
			accounts,
			chainId: 137,
			gasMultiplier: 1.1,
		},
		fantomtestnet: {
			url: 'https://rpc.testnet.fantom.network',
			accounts,
			chainId: 4002,
		},
		fantom: {
			url: 'https://rpc.ftm.tools',
			accounts,
			chainId: 250,
			gasMultiplier: 1.4,
			//gasPrice: 4000000000000,
		},
		arbitrum: {
			url: 'https://arb1.arbitrum.io/rpc',
			accounts,
			chainId: 42161,
			gasMultiplier: 1.1,
		},
		"arbitrum-goerli": {
			url: 'https://goerli-rollup.arbitrum.io/rpc',
			accounts,
			chainId: 421613,
			gasMultiplier: 1.1,
		},
	},
	typechain: {
		outDir: 'artifacts/typechain',
		target: 'ethers-v5',
	},
	dependencyCompiler: {
		paths: [
			'@uniswap/v2-periphery/contracts/interfaces/IUniswapV2Router02.sol',
			'@uniswap/v2-core/contracts/UniswapV2Factory.sol',
			'@uniswap/v2-core/contracts/UniswapV2Pair.sol',
			'@uniswap/v2-core/contracts/test/ERC20.sol',
			'@uniswap/v2-periphery/contracts/test/WETH9.sol',
		],
	},
	spdxLicenseIdentifier: {
		overwrite: true,
		runOnCompile: true,
	},
	/*
	gasReporter: {
		currency: 'EUR',
		gasPrice: 20, // in gwei
		// coinmarketcap: ,
	},
	*/
	etherscan: {
		// Your API key for Etherscan
		// Obtain one at https://etherscan.io/
		apiKey: process.env.ETHERSCAN_API_KEY
	},
	/*
	abiExporter: {
		path: './abi',
		clear: true,
		flat: true,
		// only: ['WBANToken', 'Benis'],
		spacing: 2
	},
	*/
};

export default config;
