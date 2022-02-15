import tokens from '../tokens'
import { FarmConfig } from '../types'

const farms: FarmConfig[] = [
	{
		pid: 0,
		lpSymbol: 'wBAN-USDC',
		lpAddresses: {
			dev: '',
			staging: '',
			production: '0x6bADcf8184a760326528b11057C00952811f77af',
		},
		token: tokens.wban,
		quoteToken: tokens.usdc,
		endTime: {
			dev: 0,
			staging: 0,
			production: 1648911600,
		},
	},
	{
		pid: 1,
		lpSymbol: 'wBAN-FTM',
		lpAddresses: {
			dev: '',
			staging: '',
			production: '0x1406E49b5B0dA255307FE25cC21C675D4Ffc73e0',
		},
		token: tokens.wban,
		quoteToken: tokens.ftm,
		endTime: {
			dev: 0,
			staging: 0,
			production: 1648911600,
		},
	},
]

export default farms
