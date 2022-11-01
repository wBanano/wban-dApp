import { getTokens } from '../tokens'
import { FarmConfig } from '../types'

export default class FantomFarms {
	private ENV_NAME: string = process.env.VUE_APP_ENV_NAME || ''

	getBenisAddress(): string {
		switch (this.ENV_NAME) {
			case 'dev':
			case 'staging':
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
					dev: '0x1f249F8b5a42aa78cc8a2b66EE0bb015468a5f43',
					staging: '0x1f249F8b5a42aa78cc8a2b66EE0bb015468a5f43',
					production: '0x1f249F8b5a42aa78cc8a2b66EE0bb015468a5f43',
				},
				token: tokens.wban,
				quoteToken: tokens.eth,
			},
		]
	}
}
