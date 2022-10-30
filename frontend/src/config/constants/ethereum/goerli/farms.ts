import { getTokens } from '../../tokens'
import { FarmConfig } from '../../types'

export default class FantomFarms {
	private ENV_NAME: string = process.env.VUE_APP_ENV_NAME || ''

	getBenisAddress(): string {
		switch (this.ENV_NAME) {
			case 'dev':
			case 'staging':
			case 'production':
				return '0x7c49ea16d6F260Ca0611a50Dc326dC9F4C7FBC46'
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
					production: '0xBFeC11F067Cb18760dB639A01478CfA0052dc6d3',
				},
				token: tokens.wban,
				quoteToken: tokens.weth,
			},
		]
	}
}
