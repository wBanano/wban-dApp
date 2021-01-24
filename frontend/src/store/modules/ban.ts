import { getModule, VuexModule, Module, Mutation, Action } from 'vuex-module-decorators'
import store from '@/store'
import axios from 'axios'
import { BigNumber } from 'ethers'

@Module({
	namespaced: true,
	name: 'ban',
	store,
	dynamic: true
})
class BANModule extends VuexModule {
	private _banAddress = ''
	private _banDeposited: BigNumber = BigNumber.from(0)

	get banAddress() {
		return this._banAddress
	}

	get banAddressPicture() {
		return `https://monkey.banano.cc/api/v1/monkey/${this.banAddress}?format=png`
	}

	get banDeposited() {
		return this._banDeposited
	}

	@Mutation
	setBanAddress(address: string) {
		this._banAddress = address
		localStorage.setItem('banAddress', address)
	}

	@Mutation
	setBanDeposited(balance: BigNumber) {
		this._banDeposited = balance
	}

	@Action
	init() {
		const banAddress = localStorage.getItem('banAddress')
		if (banAddress) {
			this.context.commit('setBanAddress', banAddress)
		}
	}

	@Action
	async loadBanDeposited(account: string) {
		if (account) {
			console.debug('in loadBanDeposited')
			try {
				const r = await axios.request({ url: `http://localhost:3000/deposits/${account}` })
				const banBalance = r.data.deposits
				this.context.commit('setBanAddress', account)
				this.context.commit('setBanDeposited', BigNumber.from(banBalance))
			} catch (err) {
				console.error(err)
			}
		} else {
			console.error("Can't load BAN deposited as address is empty")
		}
	}
}

export default getModule(BANModule)
