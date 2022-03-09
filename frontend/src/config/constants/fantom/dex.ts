export default class DEX {
	getDexUrl() {
		return 'https://spookyswap.finance'
	}
	get0xSwapAPI(): string {
		return 'https://fantom.api.0x.org/swap/v1/quote'
	}
	get0xExchangeRouterAddress(): string {
		return '0xdef189deaef76e379df891899eb5a00a94cbc250'
	}
}
