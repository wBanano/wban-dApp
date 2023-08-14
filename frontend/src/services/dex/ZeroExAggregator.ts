import { DEXAggregator } from './DEXAggregator'
import { SwapPath, SwapQuoteRequest, QuoteResponse, SwapResponse, SwapRoute } from '@/models/dex/SwapQuote'
import { getDexAggregatorUri } from '@/config/constants/dex'
import TokensUtil from '@/utils/TokensUtil'
import { BigNumber, ethers } from 'ethers'
import axios, { AxiosResponse, AxiosError } from 'axios'
import { stringify } from 'qs'

const ZERO_EX_API_KEY = '4ded7f7b-e53c-4726-90fd-03f277466a43'

class ZeroExAggregator implements DEXAggregator {
	async getQuote(request: SwapQuoteRequest, skipValidation = false): Promise<QuoteResponse> {
		return this.get0xQuote(request, skipValidation)
	}

	async getSwap(request: SwapQuoteRequest, gaslessSwap: boolean, skipValidation = false): Promise<SwapResponse> {
		return this.get0xQuote(request, skipValidation)
	}

	async get0xQuote(request: SwapQuoteRequest, skipValidation = false): Promise<SwapResponse> {
		const { user, from, to, slippagePercentage, nativeCurrency } = request
		let { gasPrice } = request
		const sellAmount = ethers.utils.parseUnits(from.amount, from.token.decimals).toString()
		try {
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const params: any = {
				buyToken: to.address !== '' ? to.address : nativeCurrency,
				sellToken: from.token.address !== '' ? from.token.address : nativeCurrency,
				sellAmount: sellAmount,
				takerAddress: user,
				slippagePercentage: slippagePercentage / 100,
				affiliateAddress: '0xFD1Dc8Bf39Bc0e373068746787c1296a5aEF31Ee', // wBAN smart-contract deployer
				// excludedSources: 'Uniswap_V3',
				skipValidation: skipValidation,
			}
			if (!gasPrice.isZero()) {
				params.gasPrice = ethers.utils.formatUnits(gasPrice, 'wei')
			}
			// get quote from 0x
			const apiUrl = `${getDexAggregatorUri()}?${stringify(params)}`
			console.debug('0x API request', apiUrl)
			const result = await axios.get(apiUrl, { headers: { '0x-api-key': ZERO_EX_API_KEY } })
			const { price, guaranteedPrice } = result.data
			const value = BigNumber.from(result.data.value)
			const gas = BigNumber.from(result.data.gas)
			gasPrice = BigNumber.from(result.data.gasPrice)
			const txnTo = result.data.to
			const txnData = result.data.data
			const toAmount = ethers.utils.formatUnits(BigNumber.from(result.data.buyAmount), to.decimals)
			const allowanceTarget = result.data.allowanceTarget
			// extract swap path
			const orders = result.data.orders
			const route: SwapRoute = await Promise.all(
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				orders.map(async (order: any) => {
					const source = order.source
					const fromToken = await TokensUtil.getToken(order.takerToken)
					const toToken = await TokensUtil.getToken(order.makerToken)
					if (!fromToken || !toToken) {
						throw Error("Can't find expected tokens")
					}
					const path: SwapPath = {
						source: source,
						from: fromToken,
						to: toToken,
					}
					console.debug(`Swap ${fromToken?.symbol} -> ${toToken?.symbol} (${source})`)
					return path
				}),
			)
			console.log('Route:', route)
			return {
				price: price,
				guaranteedPrice: guaranteedPrice,
				from: from,
				to: { token: to, amount: toAmount },
				value: value,
				gas: gas,
				gasPrice: gasPrice,
				txnTo: txnTo,
				txnData: txnData,
				route: route,
				allowanceTarget: allowanceTarget,
			}
		} catch (err: unknown | AxiosError) {
			console.error(err)
			if (axios.isAxiosError(err)) {
				// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
				const response: AxiosResponse = (err as AxiosError).response!
				throw new Error(response.data.values.message)
			}
			throw new Error('Unexpected error')
		}
	}
}

export { ZeroExAggregator }
