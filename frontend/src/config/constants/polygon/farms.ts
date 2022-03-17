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
	},
]

export default farms
