import { SwapQuoteRequest, QuoteResponse, SwapResponse } from '@/models/dex/SwapQuote'
import { OneInchAggregator } from '@/services/dex/1inchAggregator'
import { DEXAggregator } from '@/services/dex/DEXAggregator'
import { ZeroExAggregator } from '@/services/dex/ZeroExAggregator'

class DEXUtils {
	private static readonly zeroExAggregator = new ZeroExAggregator()
	private static readonly oneInchAggregator = new OneInchAggregator()

	static async getQuote(request: SwapQuoteRequest, skipValidation = false): Promise<QuoteResponse> {
		return DEXUtils.getDexAggregator(request).getQuote(request, skipValidation)
	}

	static async getSwap(request: SwapQuoteRequest, gaslessSwap: boolean, skipValidation = false): Promise<SwapResponse> {
		return DEXUtils.getDexAggregator(request).getSwap(request, gaslessSwap, skipValidation)
	}

	static getDexAggregator(request: SwapQuoteRequest): DEXAggregator {
		let aggregator: DEXAggregator
		switch (request.dexAggregator) {
			case '0x':
				aggregator = this.zeroExAggregator
				break
			case '1inch':
				aggregator = this.oneInchAggregator
				break
			default:
				throw new Error(`Unsupported DEX aggregator ${request.dexAggregator}`)
		}
		return aggregator
	}
}

export { DEXUtils }
