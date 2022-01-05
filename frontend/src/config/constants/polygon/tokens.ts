import { TokensList } from '../types'

const tokens: TokensList = {
	wban: {
		symbol: 'wBAN',
		address: {
			dev: '',
			staging: '0xE73380fB0A3F759fa6822e319FDfE2818d614c94',
			production: '0xe20B9e246db5a0d21BF9209E4858Bc9A3ff7A034'
		},
		decimals: 18,
		projectLink: 'https://polygon.banano.cc/'
	},
	matic: {
		symbol: 'MATIC',
		projectLink: 'https://polygon.tech'
	},
	busd: {
		symbol: 'BUSD',
		address: {
			dev: '0xed24fc36d5ee211ea25a80239fb8c4cfd80f12ee',
			staging: '0xed24fc36d5ee211ea25a80239fb8c4cfd80f12ee',
			production: '0xe9e7cea3dedca5984780bafc599bd69add087d56'
		},
		decimals: 18,
		projectLink: 'https://www.paxos.com/busd/'
	},
	weth: {
		symbol: 'WETH',
		address: {
			dev: '',
			staging: '',
			production: '0x7ceb23fd6bc0add59e62ac25578270cff1b9f619'
		},
		decimals: 18,
		projectLink: 'https://weth.io/'
	}
}

export default tokens
