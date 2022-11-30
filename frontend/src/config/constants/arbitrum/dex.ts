import { DEXAggregator } from '@/models/dex/SwapQuote'

export default class DEX {
	getDexUrl() {
		return 'https://app.sushi.com/legacy'
	}
	getDexAggregator(): DEXAggregator {
		return '1inch'
	}
	getDexAggregatorUri(): string {
		return 'https://api.1inch.io/v5.0/42161'
	}
	getDexAggregatorAllowanceTarget(): string {
		return '0x1111111254eeb25477b68fb85ed929f73a960582'
	}
}
