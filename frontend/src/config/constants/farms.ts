import tokens from './tokens'
import { FarmConfig } from './types'

const farms: FarmConfig[] = [
	{
		pid: 0,
		lpSymbol: 'wBAN',
		lpAddresses: {
			dev: '0xfa979b6080583bD3Af0B5A4B9b8054bD17bEE1B7',
			staging: '0x58EDaBF911597C4DE6AC95ABb462D02ef94d5c66',
			production: ''
		},
		token: tokens.wban,
		quoteToken: tokens.wban,
		endTime: {
			dev: 1621015421 + 1 * 24 * 60 * 60,
			staging: 1621076825 + 1 * 24 * 60 * 60,
			production: 0
		}
	},
	{
		pid: 1,
		lpSymbol: 'wBAN-BNB (SushiSwap)',
		lpAddresses: {
			dev: '0x0561ccb9c6733f84307eb9b0add613d974927c08',
			staging: '0x85cc96a70567cc3065762ee2619525bc9be3a361',
			production: ''
		},
		token: tokens.wban,
		quoteToken: tokens.bnb,
		endTime: {
			dev: 1621015421 + 1 * 24 * 60 * 60,
			staging: 1621076825 + 1 * 24 * 60 * 60,
			production: 0
		}
	},
	{
		pid: 2,
		lpSymbol: 'wBAN-BUSD (SushiSwap)',
		lpAddresses: {
			dev: '0x5BbEA3A76c330D256AF3f60834A441C1F20b6d6b',
			staging: '0x9baBE03EE20763D5F94dCb8687ec85115E249195',
			production: ''
		},
		token: tokens.wban,
		quoteToken: tokens.bnb,
		endTime: {
			dev: 1621015421 + 1 * 24 * 60 * 60,
			staging: 1621076825 + 1 * 24 * 60 * 60,
			production: 0
		}
	}
]

export default farms
