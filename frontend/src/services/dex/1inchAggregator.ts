import { DEXAggregator } from './DEXAggregator'
import { SwapPath, SwapQuoteRequest, QuoteResponse, SwapResponse, SwapRoute } from '@/models/dex/SwapQuote'
import { getDexAggregatorUri } from '@/config/constants/dex'
import TokensUtil from '../../utils/TokensUtil'
import { BigNumber, ethers } from 'ethers'
import axios, { AxiosResponse, AxiosError } from 'axios'
import qs from 'qs'
import { InsufficientLiquidityError } from './Errors'
import Backend from '@/store/modules/backend'

class OneInchAggregator implements DEXAggregator {
	async getQuote(request: SwapQuoteRequest): Promise<QuoteResponse> {
		const { from, to } = request
		const { gasPrice } = request
		const sellAmount = ethers.utils.parseUnits(from.amount, from.token.decimals).toString()
		try {
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const params: any = {
				fromTokenAddress: from.token.address !== '' ? from.token.address : '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE',
				toTokenAddress: to.address !== '' ? to.address : '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE',
				amount: sellAmount,
				fee: 0,
			}
			if (!gasPrice.isZero()) {
				params.gasPrice = ethers.utils.formatUnits(gasPrice, 'wei')
			}
			// get quote from 1nch
			const apiUrl = `${getDexAggregatorUri()}/quote?${qs.stringify(params)}`
			console.debug('1inch API request', apiUrl)
			const result = await axios.get(apiUrl)
			const gas = BigNumber.from(result.data.estimatedGas)
			const toAmount = ethers.utils.formatUnits(BigNumber.from(result.data.toTokenAmount), to.decimals)
			// extract swap path
			const protocols = result.data.protocols
			console.log('Protocols:', protocols)
			const route: SwapRoute = await Promise.all(
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				protocols.flatMap((protocol: Array<any>) => {
					// eslint-disable-next-line @typescript-eslint/no-explicit-any
					return protocol.flatMap((orders: Array<any>) => {
						// eslint-disable-next-line @typescript-eslint/no-explicit-any
						return orders.flatMap(async (order: any) => {
							console.debug('Order:', order)
							const source = order.name
							const fromToken = await TokensUtil.getToken(
								order.fromTokenAddress === '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE'.toLowerCase()
									? ''
									: order.fromTokenAddress
							)
							const toToken = await TokensUtil.getToken(
								order.toTokenAddress === '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE'.toLowerCase()
									? ''
									: order.toTokenAddress
							)
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
						})
					})
				})
			)
			console.log('Route:', route)
			return {
				from: from,
				to: { token: to, amount: toAmount },
				gas: gas,
				gasPrice: gasPrice,
				route: route,
			}
		} catch (err: unknown | AxiosError) {
			console.error('1inch quote error', err)
			if (axios.isAxiosError(err)) {
				// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
				const response: AxiosResponse = (err as AxiosError).response!
				const description = response.data.description
				if (description === 'insufficient liquidity') {
					throw new InsufficientLiquidityError(description)
				} else {
					throw new Error(description)
				}
			}
			throw new Error('Unexpected error')
		}
	}

	async getSwap(request: SwapQuoteRequest, gaslessSwap: boolean, skipValidation = false): Promise<SwapResponse> {
		const { user, from, to, slippagePercentage } = request
		let { gasPrice } = request
		const sellAmount = ethers.utils.parseUnits(from.amount, from.token.decimals).toString()
		try {
			const gaslessSwapContract = Backend.gaslessSettings.swapContract
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const params: any = {
				fromTokenAddress: from.token.address !== '' ? from.token.address : '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE',
				toTokenAddress: to.address !== '' ? to.address : '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE',
				amount: sellAmount,
				fromAddress: gaslessSwap ? gaslessSwapContract : user,
				slippage: slippagePercentage,
				fee: 0,
				allowPartialFill: false,
				disableEstimate: skipValidation,
			}
			if (!gasPrice.isZero()) {
				params.gasPrice = ethers.utils.formatUnits(gasPrice, 'wei')
			}
			// get quote from 1nch
			const apiUrl = `${getDexAggregatorUri()}/swap?${qs.stringify(params)}`
			console.debug('1inch API request', apiUrl)
			const result = await axios.get(apiUrl)
			const price = result.data.tx.gasPrice
			const value = BigNumber.from(result.data.tx.value)
			const gas = BigNumber.from(result.data.tx.gas)
			gasPrice = BigNumber.from(result.data.tx.gasPrice).mul(25).div(100)
			const txnTo = result.data.tx.to
			const txnData = result.data.tx.data
			const toAmount = ethers.utils.formatUnits(BigNumber.from(result.data.toTokenAmount), to.decimals)
			const allowanceTarget = result.data.tx.to
			// extract swap path
			const protocols = result.data.protocols
			console.log('Protocols:', protocols)
			const route: SwapRoute = await Promise.all(
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				protocols.flatMap((protocol: Array<any>) => {
					// eslint-disable-next-line @typescript-eslint/no-explicit-any
					return protocol.flatMap((orders: Array<any>) => {
						// eslint-disable-next-line @typescript-eslint/no-explicit-any
						return orders.flatMap(async (order: any) => {
							console.debug('Order:', order)
							const source = order.name
							const fromToken = await TokensUtil.getToken(
								order.fromTokenAddress === '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE'.toLowerCase()
									? ''
									: order.fromTokenAddress
							)
							const toToken = await TokensUtil.getToken(
								order.toTokenAddress === '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE'.toLowerCase()
									? ''
									: order.toTokenAddress
							)
							if (!fromToken || !toToken) {
								throw Error("Can't find expected tokens")
							}
							const path: SwapPath = {
								source: source,
								from: fromToken,
								to: toToken,
							}
							console.debug('Path:', path)
							console.debug(`Swap ${fromToken?.symbol} -> ${toToken?.symbol} (${source})`)
							return path
						})
					})
				})
			)
			console.log('Route:', route)
			return {
				price: price,
				// guaranteedPrice: guaranteedPrice,
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

export { OneInchAggregator }
