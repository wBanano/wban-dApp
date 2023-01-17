import { getTokens } from '../tokens'
import { FarmConfig } from '../types'

export default class PolygonFarms {
	private ENV_NAME: string = process.env.VUE_APP_ENV_NAME || ''

	getBenisAddress(): string {
		switch (this.ENV_NAME) {
			case 'dev':
				return '0xCA24D45C36951f0969574023507F21CA636D6345'
			case 'staging':
				return '0xefa4aED9Cf41A8A0FcdA4e88EfA2F60675bAeC9F'
			case 'production':
				return '0xefa4aED9Cf41A8A0FcdA4e88EfA2F60675bAeC9F'
			default:
				throw new Error('Unexpected network')
		}
	}

	getZapAddress(): string {
		return '0x825EC74e89a4F48eDb92F3af89f29DAA0aD70CA8'
	}

	getFarms(): FarmConfig[] {
		const tokens = getTokens()
		return [
			{
				pid: 0,
				lpSymbol: 'wBAN-WETH',
				lpAddresses: {
					dev: '',
					staging: '0xb556feD3B348634a9A010374C406824Ae93F0CF8',
					production: '0xb556feD3B348634a9A010374C406824Ae93F0CF8',
				},
				token: tokens.wban,
				quoteToken: tokens.weth,
			},
		]
	}
}
