import { TokensList } from '../types'

const tokens: TokensList = {
	wban: {
		symbol: 'wBAN',
		address: {
			dev: '0x8e29C5f6Aa0F4a7595B53295152f4c7c427C8fb4',
			staging: '0x9222D24274E912F4d5E889b460924C4fEFe97954',
			production: '0xe20B9e246db5a0d21BF9209E4858Bc9A3ff7A034'
		},
		decimals: 18,
		projectLink: 'https://bsc.banano.cc/'
	},
	bnb: {
		symbol: 'BNB',
		projectLink: 'https://www.binance.com/'
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
	}
}

export default tokens
