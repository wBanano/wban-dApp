import tokens from './tokens'
import { FarmConfig } from './types'

const farms: FarmConfig[] = [
	{
		pid: 0,
		lpSymbol: 'wBAN',
		lpAddresses: {
			dev: '0x8e29C5f6Aa0F4a7595B53295152f4c7c427C8fb4',
			staging: '0x8707Dc43c5B31189C2886309352ece6865a1f9a6',
			production: ''
		},
		token: tokens.wban,
		quoteToken: tokens.wban,
		endTime: {
			dev: 1622142747,
			staging: 1622018290 + 2 * 24 * 60 * 60,
			production: 0
		}
	},
	{
		pid: 1,
		lpSymbol: 'wBAN-BNB',
		lpAddresses: {
			dev: '0x4A80A8FF323beA03f16647647B53C2d4B619a31F',
			staging: '0x172a457450a908F96ea8467CA43a348222237168',
			production: ''
		},
		token: tokens.wban,
		quoteToken: tokens.bnb,
		endTime: {
			dev: 1622142747,
			staging: 1622018290 + 2 * 24 * 60 * 60,
			production: 0
		}
	},
	{
		pid: 2,
		lpSymbol: 'wBAN-BUSD',
		lpAddresses: {
			dev: '0x006554C403C65E07837ec5a6059D318AD3F901a1',
			staging: '0x611266E09b734aB6233b6aF8e54dA51Db6A7eF34',
			production: ''
		},
		token: tokens.wban,
		quoteToken: tokens.busd,
		endTime: {
			dev: 1622142747,
			staging: 1622018290 + 2 * 24 * 60 * 60,
			production: 0
		}
	}
]

export default farms
