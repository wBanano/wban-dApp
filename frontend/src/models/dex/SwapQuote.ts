import { EMPTY_TOKEN, Token } from '@/config/constants/dex'
import { TokenAmount } from '@/models/dex/TokenAmount'
import { BigNumber } from 'ethers'

type SwapPath = {
	source: string
	from: Token
	to: Token
}

type SwapRoute = Array<SwapPath>

type SwapQuoteRequest = {
	user: string
	from: TokenAmount
	to: Token
	gasPrice: BigNumber
	slippagePercentage: number
	nativeCurrency: string
}

type SwapQuoteResponse = {
	price: string
	guaranteedPrice: string
	from: TokenAmount
	to: TokenAmount
	value: BigNumber
	gas: BigNumber
	gasPrice: BigNumber
	txnTo: string
	txnData: string
	route: SwapRoute
	allowanceTarget: string
}

const EMPTY_QUOTE: SwapQuoteResponse = {
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

export { SwapQuoteRequest, SwapQuoteResponse, SwapRoute, SwapPath, EMPTY_QUOTE }
