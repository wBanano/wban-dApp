import tokens from '../tokens'
import { FarmConfig } from '../types'

const farms: FarmConfig[] = [
	{
		pid: 0,
		lpSymbol: 'wBAN-WETH',
		lpAddresses: {
			dev: '',
			staging: '',
			production: '0xb556feD3B348634a9A010374C406824Ae93F0CF8',
		},
		token: tokens.wban,
		quoteToken: tokens.weth,
		endTime: {
			dev: 0,
			staging: 0,
			production: 1645887600,
		},
	},
]

export default farms
