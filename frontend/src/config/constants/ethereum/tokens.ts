import { TokensList } from '../types'

const tokens: TokensList = {
	wban: {
		symbol: 'wBAN',
		address: {
			dev: '',
			staging: '0xe20B9e246db5a0d21BF9209E4858Bc9A3ff7A034',
			production: '0xe20B9e246db5a0d21BF9209E4858Bc9A3ff7A034',
		},
		decimals: 18,
		projectLink: 'https://ethereum.banano.cc/',
	},
	eth: {
		symbol: 'ETH',
		projectLink: 'https://ethereum.org',
	},
	weth: {
		symbol: 'WETH',
		address: {
			dev: '',
			staging: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
			production: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
		},
		decimals: 18,
	},
}

export default tokens
