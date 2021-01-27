import { getModule, VuexModule, Module, Mutation, Action } from 'vuex-module-decorators'
import store from '@/store'
// eslint-disable-next-line @typescript-eslint/camelcase
import { WBANToken, WBANToken__factory } from '@artifacts/typechain'
import { BigNumber } from 'ethers'

@Module({
	namespaced: true,
	name: 'contracts',
	store,
	dynamic: true
})
class ContractsModule extends VuexModule {
	private _wBanToken: WBANToken | null = null
	private _owner = ''
	private _totalSupply: BigNumber = BigNumber.from(0)
	private _wBanBalance = 0
	private _bnbDeposits = 0

	get wbanContract() {
		return this._wBanToken
	}

	get owner() {
		return this._owner
	}

	get totalSupply() {
		return this._totalSupply
	}

	get wBanBalance() {
		return this._wBanBalance
	}

	get bnbDeposits() {
		return this._bnbDeposits
	}

	@Mutation
	setWBANToken(contract: WBANToken) {
		this._wBanToken = contract
	}

	@Mutation
	setOwner(owner: string) {
		this._owner = owner
	}

	@Mutation
	setTotalSupply(supply: BigNumber) {
		this._totalSupply = supply
	}

	@Mutation
	setWBANBalance(balance: number) {
		this._wBanBalance = balance
	}

	@Mutation
	setBNBDeposits(deposits: number) {
		this._bnbDeposits = deposits
	}

	@Action
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	async initContract(provider: any) {
		console.debug('in initContract')
		const address = '0x6E3BC96EfBA650E89D56e94189c922BA07bfAcDD'
		if (provider) {
			// eslint-disable-next-line @typescript-eslint/camelcase
			const contract = WBANToken__factory.connect(address, provider.getSigner())
			const owner = await contract.owner()
			const totalSupply: BigNumber = await contract.totalSupply()
			this.context.commit('setWBANToken', contract)
			this.context.commit('setOwner', owner)
			this.context.commit('setTotalSupply', totalSupply)
		}
	}

	@Action
	async loadBalances(contract: WBANToken, account: string) {
		console.debug('in loadBalances')
		const balance = await contract.balanceOf(account)
		console.info(`Balance is ${balance} wBAN`)
		this.context.commit('setWBANBalance', balance)

		/*
		const bnbDeposits = await this.context.getters.wBanToken.bnbBalanceOf(account)
		console.info(`BNB available balance for swaps for ${account}:  ${bnbDeposits} BNB`)
		this.context.commit('setBNBDeposits', bnbDeposits)
		*/
	}
}

export default getModule(ContractsModule)
