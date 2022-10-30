import { TokensList } from '../types'

const tokens: TokensList = {
	wban: {
		symbol: 'wBAN',
		address: {
			dev: '0xe20b9e246db5a0d21bf9209e4858bc9a3ff7a034',
			staging: '0xe20B9e246db5a0d21BF9209E4858Bc9A3ff7A034',
			production: '0xe20B9e246db5a0d21BF9209E4858Bc9A3ff7A034',
		},
		decimals: 18,
		projectLink: 'https://bsc.banano.cc/',
	},
	bnb: {
		symbol: 'BNB',
		projectLink: 'https://www.binance.com/',
	},
	busd: {
		symbol: 'BUSD',
		address: {
			dev: '0xed24fc36d5ee211ea25a80239fb8c4cfd80f12ee',
			staging: '0xe9e7cea3dedca5984780bafc599bd69add087d56',
			production: '0xe9e7cea3dedca5984780bafc599bd69add087d56',
		},
		decimals: 18,
		projectLink: 'https://www.paxos.com/busd/',
	},
}

export default tokens
