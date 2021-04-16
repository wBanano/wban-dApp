const BSC_MAINNET: AddEthereumChainParameter = {
	chainId: '0x38',
	chainName: 'Binance Smart Chain',
	nativeCurrency: {
		name: 'BNB',
		symbol: 'BNB',
		decimals: 18
	},
	rpcUrls: [
		'https://bsc-dataseed.binance.org/',
		'https://bsc-dataseed1.defibit.io/',
		'https://bsc-dataseed1.ninicoin.io/'
	],
	blockExplorerUrls: ['https://www.bscscan.com']
}

const BSC_TESTNET: AddEthereumChainParameter = {
	chainId: '0x61',
	chainName: 'Binance Smart Chain',
	nativeCurrency: {
		name: 'BNB',
		symbol: 'BNB',
		decimals: 18
	},
	rpcUrls: [
		'https://data-seed-prebsc-1-s1.binance.org:8545/',
		'https://data-seed-prebsc-2-s1.binance.org:8545/',
		'https://data-seed-prebsc-1-s2.binance.org:8545/'
	],
	blockExplorerUrls: ['https://testnet.bscscan.com']
}

class Networks {
	private networks: Map<string, AddEthereumChainParameter>

	constructor() {
		this.networks = new Map()
		this.networks.set('0x38', BSC_MAINNET)
		this.networks.set('0x61', BSC_TESTNET)
	}

	public getNetworkData(chainId: string): AddEthereumChainParameter | undefined {
		return this.networks.get(chainId)
	}
}

interface AddEthereumChainParameter {
	chainId: string
	chainName: string
	nativeCurrency: {
		name: string
		symbol: string // 2-6 characters long
		decimals: 18
	}
	rpcUrls: string[]
	blockExplorerUrls?: string[]
	iconUrls?: string[] // Currently ignored.
}

export { Networks, AddEthereumChainParameter }
