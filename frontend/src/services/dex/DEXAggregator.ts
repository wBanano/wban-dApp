import { SwapQuoteRequest, QuoteResponse, SwapResponse } from '@/models/dex/SwapQuote'
import { OneInchAggregator } from './1inchAggregator'

interface DEXAggregator {
	getQuote(request: SwapQuoteRequest, skipValidation: boolean): Promise<QuoteResponse>;
	getSwap(request: SwapQuoteRequest, gaslessSwap: boolean, skipValidation: boolean): Promise<SwapResponse>;
}

export { DEXAggregator }
