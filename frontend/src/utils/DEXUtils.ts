import { SwapPath, SwapQuoteRequest, SwapQuoteResponse, SwapRoute } from '@/models/dex/SwapQuote'
import { get0xSwapAPI, get0xExchangeRouterAddress } from '@/config/constants/dex'
import TokensUtil from './TokensUtil'
import { BigNumber, ethers } from 'ethers'
import axios from 'axios'
import qs from 'qs'

class DEXUtils {
	static async getQuote(request: SwapQuoteRequest, skipValidation = false): Promise<SwapQuoteResponse> {
		const { user, from, to } = request
		let { gasPrice } = request
		const sellAmount = ethers.utils.parseUnits(from.amount, from.token.decimals).toString()
		try {
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const params: any = {
				buyToken: to.address,
				sellToken: from.token.address,
				sellAmount: sellAmount,
				takerAddress: user,
				gasPrice: gasPrice.toNumber(),
				slippagePercentage: 0.002, // 0.2% slippage
				affiliateAddress: '0xFD1Dc8Bf39Bc0e373068746787c1296a5aEF31Ee', // wBAN smart-contract deployer
				skipValidation: skipValidation,
			}
			// get quote from 0x
			const apiUrl = `${get0xSwapAPI()}?${qs.stringify(params)}`
			console.debug('0x API request', apiUrl)
			const result = await axios.get(apiUrl)
			const { price, guaranteedPrice } = result.data
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
				})
			)
			// return quote
			return {
				price: price,
				guaranteedPrice: guaranteedPrice,
				from: from,
				to: { token: to, amount: toAmount },
				gas: gas,
				gasPrice: gasPrice,
				txnTo: txnTo,
				txnData: txnData,
				route: route,
				allowanceTarget: allowanceTarget,
			}
		} catch (error) {
			console.error(error)
			throw new Error(error.response.data.values.message)
		}
	}
	static get0xExchangeRouterAddress(): string {
		return get0xExchangeRouterAddress()
	}
}

export { DEXUtils }
