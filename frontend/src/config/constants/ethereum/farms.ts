import { getTokens } from '../tokens'
import { FarmConfig } from '../types'

export default class FantomFarms {
	private ENV_NAME: string = process.env.VUE_APP_ENV_NAME || ''

	getBenisAddress(): string {
		switch (this.ENV_NAME) {
			case 'dev':
				return ''
			case 'production':
				return '0xD91f84D4E2d9f4fa508c61356A6CB81a306e5287'
			default:
				throw new Error('Unexpected network')
		}
	}

	getFarms(): FarmConfig[] {
		const tokens = getTokens()
		return [
			{
				pid: 0,
				lpSymbol: 'wBAN-ETH',
				lpAddresses: {
					dev: '',
					staging: '',
					production: '',
				},
				token: tokens.wban,
				quoteToken: tokens.weth,
			},
		]
	}
}
