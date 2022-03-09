export default class DEX {
	getDexUrl() {
		return 'https://app.sushi.com'
	}
	get0xSwapAPI(): string {
		return 'https://polygon.api.0x.org/swap/v1/quote'
	}
	get0xExchangeRouterAddress(): string {
		return '0xdef1c0ded9bec7f1a1670819833240f027b25eff'
	}
}
