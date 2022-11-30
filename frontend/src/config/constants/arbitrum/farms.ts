import { getTokens } from '../tokens'
import { FarmConfig } from '../types'

export default class FantomFarms {
	private ENV_NAME: string = process.env.VUE_APP_ENV_NAME || ''

	getBenisAddress(): string {
		switch (this.ENV_NAME) {
			case 'dev':
			case 'staging':
			case 'production':
				return '0x8cd4DED2b49736B1a1Dbe18B9EB4BA6b6BF28227'
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
					staging: '0xBD80923830B1B122dcE0C446b704621458329F1D',
					production: '0xBD80923830B1B122dcE0C446b704621458329F1D',
				},
				token: tokens.wban,
				quoteToken: tokens.eth,
			},
		]
	}
}
