import { TokensList } from '../../types'

const tokens: TokensList = {
	wban: {
		symbol: 'wBAN',
		address: {
			dev: '',
			staging: '',
			production: '0xad043D3b1D86f50a7a1D3f370B23a0963b435a91',
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
			staging: '',
			production: '0xB4FBF271143F4FBf7B91A5ded31805e42b2208d6',
		},
		decimals: 18,
	},
}

export default tokens
