import { getModule, VuexModule, Module, Mutation, Action } from 'vuex-module-decorators'
import store from '@/store'
import Prices from '@/store/modules/prices'

@Module({
	namespaced: true,
	name: 'ban',
	store,
	dynamic: true,
})
class BANModule extends VuexModule {
	private _banAddress = ''
	private _banPriceInUSD = 0
	private _initialized = false

	get banAddress() {
		return this._banAddress
	}

	get banPriceInUSD() {
		return this._banPriceInUSD
	}

	get banAddressPicture() {
		return `https://monkey.banano.cc/api/v1/monkey/${this.banAddress}?format=png&svc=wBAN`
	}

	@Mutation
	setBanAddress(address: string) {
		this._banAddress = address
		localStorage.setItem('banAddress', address)
	}

	@Mutation
	setBanPriceInUSD(price: number) {
		this._banPriceInUSD = price
	}

	@Mutation
	setInitialized(initialized: boolean) {
		this._initialized = initialized
	}

	@Action
	async init() {
		const banAddress = localStorage.getItem('banAddress')
		if (banAddress) {
			this.context.commit('setBanAddress', banAddress)
		}
		if (!this._initialized) {
			await Prices.loadPrices()
			const wbanPrice = Prices.prices.get('wBAN')
			console.debug(`BAN price: $${wbanPrice}`)
			this.context.commit('setBanPriceInUSD', wbanPrice)
			this.context.commit('setInitialized', true)
		}
	}

	@Action
	setBanAccount(account: string) {
		this.context.commit('setBanAddress', account)
	}
}

export default getModule(BANModule)
