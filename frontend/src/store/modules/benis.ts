import { getModule, VuexModule, Module, Mutation, Action } from 'vuex-module-decorators'
import { namespace } from 'vuex-class'
import { BindingHelpers } from 'vuex-class/lib/bindings'
import store from '@/store'
// eslint-disable-next-line @typescript-eslint/camelcase
import { Benis, Benis__factory } from '@artifacts/typechain'
import { BigNumber } from 'ethers'
import { FarmConfig } from '@/config/constants/types'
import farms from '@/config/constants/farms'

@Module({
	namespaced: true,
	name: 'benis',
	store,
	dynamic: true
})
class BenisModule extends VuexModule {
	private _benis: Benis | null = null
	private _farms: Array<FarmConfig> = []
	private _farmsCount: BigNumber = BigNumber.from(0)

	static BENIS_CONTRACT_ADDRESS: string = process.env.VUE_APP_BENIS_CONTRACT || ''

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
	async initContract(provider: any) {
		console.debug('in initContract')
		if (provider) {
			// do not initialize contract if this was done earlier
			if (!this._benis) {
				// eslint-disable-next-line @typescript-eslint/camelcase
				const benis = Benis__factory.connect(BenisModule.BENIS_CONTRACT_ADDRESS, provider.getSigner())
				this.context.commit('setBenis', benis)

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
