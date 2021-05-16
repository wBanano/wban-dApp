import tokens from './tokens'
import { FarmConfig } from './types'

const farms: FarmConfig[] = [
	{
		pid: 0,
		lpSymbol: 'wBAN',
		lpAddresses: {
			dev: '0x3CeCA6F19fbf2e6f1B3B50aCBaE78fC531E350b6',
			staging: '0x58EDaBF911597C4DE6AC95ABb462D02ef94d5c66',
			production: ''
		},
		token: tokens.wban,
		quoteToken: tokens.wban,
		endTime: {
			dev: 1621241204 + 1 * 24 * 60 * 60,
			staging: 1621076825 + 1 * 24 * 60 * 60,
			production: 0
		}
	},
	{
		pid: 1,
		lpSymbol: 'wBAN-BNB (SushiSwap)',
		lpAddresses: {
			dev: '0xbDbdAbB84E4705f939a239760A1d0F25A6FA4a21',
			staging: '0x85cc96a70567cc3065762ee2619525bc9be3a361',
			production: ''
		},
		token: tokens.wban,
		quoteToken: tokens.bnb,
		endTime: {
			dev: 1621241204 + 1 * 24 * 60 * 60,
			staging: 1621076825 + 1 * 24 * 60 * 60,
			production: 0
		}
	},
	{
		pid: 2,
		lpSymbol: 'wBAN-BUSD (SushiSwap)',
		lpAddresses: {
			dev: '0x6Ac026137d2512d36254D634fec242151B5A6302',
			staging: '0x9baBE03EE20763D5F94dCb8687ec85115E249195',
			production: ''
		},
		token: tokens.wban,
		quoteToken: tokens.busd,
		endTime: {
			dev: 1621241204 + 1 * 24 * 60 * 60,
			staging: 1621076825 + 1 * 24 * 60 * 60,
			production: 0
		}
	}
]

export default farms
