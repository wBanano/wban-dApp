import { getModule, VuexModule, Module, Mutation, Action } from 'vuex-module-decorators'
import store from '@/store'

@Module({
	namespaced: true,
	name: 'ban',
	store,
	dynamic: true
})
class BANModule extends VuexModule {
	private _banAddress = ''

	get banAddress() {
		return this._banAddress
	}

	get banAddressPicture() {
		return `https://monkey.banano.cc/api/v1/monkey/${this.banAddress}?format=png`
	}

	@Mutation
	setBanAddress(address: string) {
		this._banAddress = address
		localStorage.setItem('banAddress', address)
	}

	@Action
	init() {
		const banAddress = localStorage.getItem('banAddress')
		if (banAddress) {
			this.context.commit('setBanAddress', banAddress)
		}
	}

	@Action
	setBanAccount(account: string) {
		this.context.commit('setBanAddress', account)
	}
}

export default getModule(BANModule)
