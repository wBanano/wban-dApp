import { DEXAggregator } from '@/models/dex/SwapQuote'

export default class DEX {
	getDexUrl() {
		return 'https://spooky.fi'
	}
	getDexAggregator(): DEXAggregator {
		return '0x'
	}
	getDexAggregatorUri(): string {
		return 'https://fantom.api.0x.org/swap/v1/quote'
	}
	getDexAggregatorAllowanceTarget(): string {
		return '0xdef189deaef76e379df891899eb5a00a94cbc250'
	}
}
