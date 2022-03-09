import { getTokens } from '../tokens'
import { FarmConfig } from '../types'

export default class FantomFarms {
	private ENV_NAME: string = process.env.VUE_APP_ENV_NAME || ''

	getBenisAddress(): string {
		switch (this.ENV_NAME) {
			case 'dev':
				return '0x4b32b5E37E7Fe88c2052e20fC8074af21d43d83c'
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
				lpSymbol: 'wBAN-USDC',
				lpAddresses: {
					dev: '',
					staging: '',
					production: '0x6bADcf8184a760326528b11057C00952811f77af',
				},
				token: tokens.wban,
				quoteToken: tokens.usdc,
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
			},
		]
	}
}
