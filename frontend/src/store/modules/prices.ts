import { getModule, VuexModule, Module, Mutation, Action } from 'vuex-module-decorators'
import { namespace } from 'vuex-class'
import { BindingHelpers } from 'vuex-class/lib/bindings'
import store from '@/store'
import { ApolloClient, InMemoryCache } from '@apollo/client/core'
import { gql } from 'graphql-tag'

@Module({
	namespaced: true,
	name: 'prices',
	store,
	dynamic: true
})
class PricesModule extends VuexModule {
	private _lastUpdateTimestamp = 0
	private _prices: Map<string, number> = new Map()

	private cache = new InMemoryCache()
	private apolloClient = new ApolloClient({
		cache: this.cache,
		uri: 'https://graph.apeswap.finance/subgraphs/name/ape-swap/apeswap-subgraph'
	})

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
			const result = await this.apolloClient.query({
				query: gql`
					{
						pair(id: "0x7898466cacf92df4a4e77a3b4d0170960e43b896") {
							token1Price
						}
						bundle(id: "1") {
							ethPrice
						}
					}
				`
			})
			const data = result.data
			const bnbPrice = data.bundle.ethPrice
			const wbanPrice = data.pair.token1Price.match(/^-?\d+(?:\.\d{0,18})?/)[0]
			this.context.commit('setLastUpdateTimestamp', Date.now())
			const prices: Map<string, number> = new Map()
			prices.set('BUSD', 1)
			prices.set('wBAN', Number.parseFloat(wbanPrice))
			prices.set('WBNB', Number.parseFloat(bnbPrice))
			prices.set('BNB', Number.parseFloat(bnbPrice))
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
