import { getModule, VuexModule, Module, Mutation, Action } from 'vuex-module-decorators'
import { namespace } from 'vuex-class'
import { BindingHelpers } from 'vuex-class/lib/bindings'
import store from '@/store'
import axios from 'axios'

@Module({
	namespaced: true,
	name: 'prices',
	store,
	dynamic: true
})
class PricesModule extends VuexModule {
	private _lastUpdateTimestamp = 0
	private _prices: Map<string, number> = new Map()
	private _tokenPricesWhitelist: Set<string> = new Set(['BNB', 'BUSD', 'WBNB'])

	get lastUpdateTimeStamp(): number {
		return this._lastUpdateTimestamp
	}

	get prices(): Map<string, number> {
		return this._prices
	}

	@Mutation
	setLastUpdateTimestamp(timestamp: number) {
		this._lastUpdateTimestamp = timestamp
	}

	@Mutation
	setPrices(prices: Map<string, number>) {
		this._prices = prices
	}

	@Action
	async loadPrices() {
		console.debug('in loadPrices')
		if (Date.now() > this._lastUpdateTimestamp + 5 * 60) {
			const resp = await axios.request({ url: 'https://api.pancakeswap.info/api/v2/tokens' })
			const apiResponse: PriceApiResponse = resp.data
			this.context.commit('setLastUpdateTimestamp', apiResponse.updated_at)
			const priceData: PriceApiList = apiResponse.data
			const prices: Map<string, number> = new Map()
			Object.values(priceData).forEach(token => {
				// filter to only keep relevant tokens
				if (this._tokenPricesWhitelist.has(token.symbol)) {
					console.debug(`Setting price of ${token.symbol} to ${token.price}`)
					prices.set(token.symbol, Number.parseFloat(token.price))
				}
				if (token.symbol === 'WBNB') {
					console.debug(`Setting price of BNB to ${token.price}`)
					prices.set('BNB', Number.parseFloat(token.price))
				}
			})
			this.context.commit('setPrices', prices)
		}
	}
}

interface PriceApiResponse {
	/* eslint-disable camelcase */
	updated_at: number
	data: PriceApiList
}

interface PriceApiList {
	/* eslint-disable camelcase */
	[key: string]: {
		name: string
		symbol: string
		price: string
		price_BNB: string
	}
}

export default getModule(PricesModule)
export { PriceApiList }
export const Contracts: BindingHelpers = namespace('prices')
