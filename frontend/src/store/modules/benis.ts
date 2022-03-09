import { getModule, VuexModule, Module, Mutation, Action } from 'vuex-module-decorators'
import { namespace } from 'vuex-class'
import { BindingHelpers } from 'vuex-class/lib/bindings'
import store from '@/store'
import { Benis, Benis__factory } from '@artifacts/typechain'
import { BigNumber, ethers } from 'ethers'
import { FarmConfig } from '@/config/constants/types'
import { getBenisAddress, getFarms } from '@/config/constants/farms'
import BenisUtils from '@/utils/BenisUtils'

@Module({
	namespaced: true,
	name: 'benis',
	store,
	dynamic: true,
})
class BenisModule extends VuexModule {
	private _benis: Benis | null = null
	private _farms: Array<FarmConfig> = []
	private _farmsCount: BigNumber = BigNumber.from(0)

	get benisContract() {
		return this._benis
	}

	get farms() {
		return this._farms
	}

	get farmsCount() {
		return this._farmsCount
	}

	@Mutation
	setBenis(contract: Benis) {
		this._benis = contract
	}

	@Mutation
	setFarms(farms: Array<FarmConfig>) {
		this._farms = farms
	}

	@Mutation
	setFarmsCount(length: BigNumber) {
		this._farmsCount = length
	}

	@Action
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	async initContract(provider: ethers.providers.Web3Provider | null) {
		console.debug('in initContract')
		if (provider) {
			const oldProvider = this._benis?.provider
			// do not initialize contract if this was done earlier
			if (!this._benis || provider !== oldProvider) {
				console.debug(`Benis is available at ${getBenisAddress()}`)
				const benis = Benis__factory.connect(getBenisAddress(), provider.getSigner())
				this.context.commit('setBenis', benis)

				const farms = getFarms()
				for (let i = 0; i < farms.length; i++) {
					const farm = farms[i]
					const endTime = (await BenisUtils.getEndTime(farm.pid, benis)) * 1_000
					farm.ended = endTime <= Date.now()
				}
				this.context.commit('setFarms', farms)

				const farmsCount = farms.length
				console.debug(`Benis pools: ${farmsCount}`)
				this.context.commit('setFarmsCount', farmsCount)
			}
			// at this point the contract should be initialized
			if (!this._benis) {
				console.error('Smart-contract client not initialized')
				return
			}
		} else {
			console.warn("BenisModule can't be initialized. Missing provider.")
		}
	}
}

export default getModule(BenisModule)
export const Contracts: BindingHelpers = namespace('benis')
