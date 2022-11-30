import { getBackendHost } from '@/config/constants/backend'
import axios from 'axios'
import { BigNumber, ethers } from 'ethers'

interface Network {
	network: 'bsc' | 'polygon' | 'fantom' | 'ethereum' | 'arbitrum'
	chainId: string
	chainIdNumber: number
	chainName: string
	chainUrl: string
	nativeCurrency: {
		name: string
		symbol: string // 2-6 characters long
		decimals: 18
	}
	minimumNeededForWrap: number
	rpcUrls: string[]
	blockExplorerUrls: string[]
	iconUrls?: string[] // Currently ignored.
}

const BSC_MAINNET: Network = {
	network: 'bsc',
	chainId: '0x38',
	chainIdNumber: 56,
	chainName: 'Binance Smart Chain',
	chainUrl: 'https://www.binance.org/en/smartChain',
	nativeCurrency: {
		name: 'BNB',
		symbol: 'BNB',
		decimals: 18,
	},
	minimumNeededForWrap: 0.0006,
	rpcUrls: [
		'https://bsc-dataseed.binance.org/',
		'https://bsc-dataseed1.defibit.io/',
		'https://bsc-dataseed1.ninicoin.io/',
	],
	blockExplorerUrls: ['https://www.bscscan.com'],
}

const BSC_TESTNET: Network = {
	network: 'bsc',
	chainId: '0x61',
	chainIdNumber: 97,
	chainName: 'Binance Smart Chain Testnet',
	chainUrl: 'https://www.binance.org/en/smartChain',
	nativeCurrency: {
		name: 'BNB',
		symbol: 'BNB',
		decimals: 18,
	},
	minimumNeededForWrap: 0.0006,
	rpcUrls: [
		'https://data-seed-prebsc-1-s1.binance.org:8545/',
		'https://data-seed-prebsc-2-s1.binance.org:8545/',
		'https://data-seed-prebsc-1-s2.binance.org:8545/',
	],
	blockExplorerUrls: ['https://testnet.bscscan.com'],
}

const POLYGON_MAINNET: Network = {
	network: 'polygon',
	chainId: '0x89',
	chainIdNumber: 137,
	chainName: 'Polygon',
	chainUrl: 'https://polygon.technology',
	nativeCurrency: {
		name: 'MATIC',
		symbol: 'MATIC',
		decimals: 18,
	},
	minimumNeededForWrap: 0.02,
	rpcUrls: ['https://polygon-rpc.com'],
	blockExplorerUrls: ['https://polygonscan.com'],
}

const POLYGON_TESTNET: Network = {
	network: 'polygon',
	chainId: '0x13881',
	chainIdNumber: 80001,
	chainName: 'Polygon Testnet',
	chainUrl: 'https://polygon.technology',
	nativeCurrency: {
		name: 'MATIC',
		symbol: 'MATIC',
		decimals: 18,
	},
	minimumNeededForWrap: 0.004,
	rpcUrls: ['https://matic-mumbai.chainstacklabs.com'],
	blockExplorerUrls: ['https://mumbai.polygonscan.com'],
}

const FANTOM_MAINNET: Network = {
	network: 'fantom',
	chainId: '0xfa',
	chainIdNumber: 250,
	chainName: 'Fantom',
	chainUrl: 'https://fantom.foundation',
	nativeCurrency: {
		name: 'FTM',
		symbol: 'FTM',
		decimals: 18,
	},
	minimumNeededForWrap: 0.03,
	rpcUrls: ['https://rpc.ankr.com/fantom'],
	blockExplorerUrls: ['https://ftmscan.com'],
}

const FANTOM_TESTNET: Network = {
	network: 'fantom',
	chainId: '0xfa2',
	chainIdNumber: 4002,
	chainName: 'Fantom Testnet',
	chainUrl: 'https://fantom.foundation',
	nativeCurrency: {
		name: 'FTM',
		symbol: 'FTM',
		decimals: 18,
	},
	minimumNeededForWrap: 0.03,
	rpcUrls: ['https://rpc.testnet.fantom.network'],
	blockExplorerUrls: ['https://testnet.ftmscan.com'],
}

const ETHEREUM_MAINNET: Network = {
	network: 'ethereum',
	chainId: '0x1',
	chainIdNumber: 1,
	chainName: 'Ethereum',
	chainUrl: 'https://polygon.technology',
	nativeCurrency: {
		name: 'ETH',
		symbol: 'ETH',
		decimals: 18,
	},
	minimumNeededForWrap: 0.002,
	rpcUrls: ['https://rpc.ankr.com/eth'],
	blockExplorerUrls: ['https://etherscan.io/'],
}

const ETHEREUM_TESTNET: Network = {
	network: 'ethereum',
	chainId: '0x5',
	chainIdNumber: 5,
	chainName: 'Goerli',
	chainUrl: 'https://goerli.net/',
	nativeCurrency: {
		name: 'ETH',
		symbol: 'ETH',
		decimals: 18,
	},
	minimumNeededForWrap: 0.002,
	rpcUrls: ['https://rpc.ankr.com/eth_goerli'],
	blockExplorerUrls: ['https://goerli.etherscan.io/'],
}

const ARBITRUM_MAINNET: Network = {
	network: 'arbitrum',
	chainId: '0xa4b1',
	chainIdNumber: 42161,
	chainName: 'Arbitrum',
	chainUrl: '',
	nativeCurrency: {
		name: 'ETH',
		symbol: 'ETH',
		decimals: 18,
	},
	minimumNeededForWrap: 0.0002,
	rpcUrls: ['https://arb1.arbitrum.io/rpc'],
	blockExplorerUrls: ['https://arbiscan.io/'],
}

const ARBITRUM_TESTNET: Network = {
	network: 'arbitrum',
	chainId: '0x66eed',
	chainIdNumber: 421613,
	chainName: 'Arbitrum Goerli',
	chainUrl: '',
	nativeCurrency: {
		name: 'AGOR',
		symbol: 'AGOR',
		decimals: 18,
	},
	minimumNeededForWrap: 0.002,
	rpcUrls: ['https://goerli-rollup.arbitrum.io/rpc'],
	blockExplorerUrls: ['https://goerli.arbiscan.io/'],
}

class Networks {
	private networks: Map<string, Network>
	private testnet: Network | undefined

	constructor() {
		this.networks = new Map()
		this.networks.set(BSC_MAINNET.chainId, BSC_MAINNET)
		this.networks.set(BSC_TESTNET.chainId, BSC_TESTNET)
		this.networks.set(POLYGON_MAINNET.chainId, POLYGON_MAINNET)
		this.networks.set(POLYGON_TESTNET.chainId, POLYGON_TESTNET)
		this.networks.set(FANTOM_MAINNET.chainId, FANTOM_MAINNET)
		this.networks.set(FANTOM_TESTNET.chainId, FANTOM_TESTNET)
		this.networks.set(ETHEREUM_MAINNET.chainId, ETHEREUM_MAINNET)
		this.networks.set(ETHEREUM_TESTNET.chainId, ETHEREUM_TESTNET)
		this.networks.set(ARBITRUM_MAINNET.chainId, ARBITRUM_MAINNET)
		this.networks.set(ARBITRUM_TESTNET.chainId, ARBITRUM_TESTNET)

		const testnetSelected = process.env.VUE_APP_TESTNET
		if (testnetSelected) {
			this.testnet = this.networks.get(testnetSelected)
		}
	}

	public getSupportedNetworks(): Network[] {
		const mainnet = this.getMainnetSupportedNetworks()
		if (!this.testnet) {
			return mainnet
		}
		return [...mainnet, this.testnet]
	}

	public getMainnetSupportedNetworks(): Network[] {
		return [BSC_MAINNET, POLYGON_MAINNET, FANTOM_MAINNET, ETHEREUM_MAINNET, ARBITRUM_MAINNET]
	}

	public getNetworkData(chainId: string): Network | undefined {
		return this.networks.get(chainId.toLowerCase())
	}

	public static async getSuggestedTransactionGasPrice(): Promise<BigNumber> {
		try {
			const resp = await axios({
				method: 'get',
				url: `${getBackendHost()}/blockchain/gas-price`,
				timeout: 2_000,
			})
			return ethers.utils.parseUnits(resp.data.gasPrice, 'wei')
		} catch (err: unknown) {
			return ethers.constants.Zero
		}
	}
}

export {
	Networks,
	Network,
	BSC_MAINNET,
	BSC_TESTNET,
	POLYGON_MAINNET,
	POLYGON_TESTNET,
	FANTOM_MAINNET,
	FANTOM_TESTNET,
	ETHEREUM_MAINNET,
	ETHEREUM_TESTNET,
	ARBITRUM_MAINNET,
	ARBITRUM_TESTNET,
}
