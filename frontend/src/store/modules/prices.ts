import { getModule, VuexModule, Module, Mutation, Action } from 'vuex-module-decorators'
import { namespace } from 'vuex-class'
import { BindingHelpers } from 'vuex-class/lib/bindings'
import store from '@/store'
import axios from 'axios'

@Module({
	namespaced: true,
	name: 'prices',
	store,
	dynamic: true,
})
class PricesModule extends VuexModule {
	private _lastUpdateTimestamp = 0
	private _prices: Map<string, number> = new Map()
	static BACKEND_URL: string = process.env.VUE_APP_BACKEND_URL || ''

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
				url: `${PricesModule.BACKEND_URL}/prices`,
			})
			const apiResponse = resp.data
			const wbanPrice: number = apiResponse.ban
			const bnbPrice: number = apiResponse.bnb
			const ethPrice: number = apiResponse.eth
			const maticPrice: number = apiResponse.matic
			const ftmPrice: number = apiResponse.ftm
			const prices: Map<string, number> = new Map()
			prices.set('BUSD', 1)
			prices.set('USDC', 1)
			prices.set('wBAN', wbanPrice)
			prices.set('WBNB', bnbPrice)
			prices.set('BNB', bnbPrice)
			prices.set('WETH', ethPrice)
			prices.set('ETH', ethPrice)
			prices.set('WMATIC', maticPrice)
			prices.set('MATIC', maticPrice)
			prices.set('FTM', ftmPrice)
			prices.set('WFTM', ftmPrice)
			this.context.commit('setPrices', prices)
			this.context.commit('setLastUpdateTimestamp', Date.now())
		}
	}
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

/*
interface PriceApiResponse {
	// eslint-disable camelcase
	updated_at: number
	data: PriceApiList
}
*/

export default getModule(PricesModule)
export { PriceApiList }
export const Contracts: BindingHelpers = namespace('prices')
