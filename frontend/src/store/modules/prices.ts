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
			const resp = await axios.request({
				url: 'https://api.coingecko.com/api/v3/simple/price?ids=busd,wbnb&vs_currencies=usd'
			})
			const apiResponse = resp.data
			this.context.commit('setLastUpdateTimestamp', Date.now())
			const prices: Map<string, number> = new Map()
			const busdPrice = apiResponse.busd.usd
			const wbnbPrice = apiResponse.wbnb.usd
			prices.set('BUSD', Number.parseFloat(busdPrice))
			prices.set('WBNB', Number.parseFloat(wbnbPrice))
			prices.set('BNB', Number.parseFloat(wbnbPrice))
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
