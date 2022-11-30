import { EMPTY_TOKEN, Token } from '@/config/constants/dex'
import { TokenAmount } from '@/models/dex/TokenAmount'
import { BigNumber } from 'ethers'

type DEXAggregator = '0x' | '1inch'

type SwapPath = {
	source: string
	from: Token
	to: Token
}

type SwapRoute = Array<SwapPath>

type SwapQuoteRequest = {
	dexAggregator: DEXAggregator
	user: string
	from: TokenAmount
	to: Token
	gasPrice: BigNumber
	slippagePercentage: number
	nativeCurrency: string
}

type QuoteResponse = {
	price?: string
	guaranteedPrice?: string // FIXME
	from: TokenAmount
	to: TokenAmount
	gas: BigNumber
	gasPrice: BigNumber
	route: SwapRoute
}

type SwapResponse = {
	price: string
	guaranteedPrice?: string // FIXME
	from: TokenAmount
	to: TokenAmount
	value: BigNumber
	gas: BigNumber
	gasPrice: BigNumber
	txnTo: string
	txnData: string
	route: SwapRoute // FIXME
	allowanceTarget: string
}

const EMPTY_QUOTE: QuoteResponse = {
	price: '',
	guaranteedPrice: '',
	from: {
		amount: '',
		token: EMPTY_TOKEN,
	},
	to: {
		amount: '',
		token: EMPTY_TOKEN,
	},
	gas: BigNumber.from(0),
	gasPrice: BigNumber.from(0),
	route: [],
}

const EMPTY_SWAP: SwapResponse = {
	price: '',
	guaranteedPrice: '',
	from: {
		amount: '',
		token: EMPTY_TOKEN,
	},
	to: {
		amount: '',
		token: EMPTY_TOKEN,
	},
	value: BigNumber.from(0),
	gas: BigNumber.from(0),
	gasPrice: BigNumber.from(0),
	txnTo: '',
	txnData: '',
	route: [],
	allowanceTarget: '',
}

export { DEXAggregator, SwapQuoteRequest, QuoteResponse, SwapResponse, SwapRoute, SwapPath, EMPTY_QUOTE, EMPTY_SWAP }
