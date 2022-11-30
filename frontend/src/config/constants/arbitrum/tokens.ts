import { TokensList } from '../types'

const tokens: TokensList = {
	wban: {
		symbol: 'wBAN',
		address: {
			dev: '0x7C3128865aeab52eb6AD665798bc27abF55617dD',
			staging: '0xe20B9e246db5a0d21BF9209E4858Bc9A3ff7A034',
			production: '0xe20B9e246db5a0d21BF9209E4858Bc9A3ff7A034',
		},
		decimals: 18,
		projectLink: 'https://wrap.banano.cc/',
	},
	eth: {
		symbol: 'ETH',
		projectLink: 'https://ethereum.org',
	},
	weth: {
		symbol: 'WETH',
		address: {
			dev: '',
			staging: '0x82af49447d8a07e3bd95bd0d56f35241523fbab1',
			production: '0x82af49447d8a07e3bd95bd0d56f35241523fbab1',
		},
		decimals: 18,
		projectLink: 'https://ethereum.org',
	},
}

export default tokens
