import { TokensList } from '../types'

const tokens: TokensList = {
	wban: {
		symbol: 'wBAN',
		address: {
			dev: '',
			staging: '0xc7338729799Ca67A489fb9edb7a8D88821002E10',
			production: '0xe20B9e246db5a0d21BF9209E4858Bc9A3ff7A034',
		},
		decimals: 18,
		projectLink: 'https://fantom.banano.cc/',
	},
	ftm: {
		symbol: 'FTM',
		projectLink: 'https://fantom.foundation',
	},
	wftm: {
		symbol: 'WFTM',
		address: {
			dev: '',
			staging: '',
			production: '0x21be370D5312f44cB42ce377BC9b8a0cEF1A4C83',
		},
		decimals: 18,
		projectLink: 'https://fantom.banano.cc/',
	},
	usdc: {
		symbol: 'USDC',
		address: {
			dev: '',
			staging: '',
			production: '0x04068DA6C83AFCFA0e13ba15A6696662335D5B75',
		},
		decimals: 6,
		projectLink: 'https://www.centre.io',
	},
}

export default tokens
