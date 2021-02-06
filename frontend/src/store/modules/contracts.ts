import { getModule, VuexModule, Module, Mutation, Action } from 'vuex-module-decorators'
import store from '@/store'
// eslint-disable-next-line @typescript-eslint/camelcase
import { WBANToken, WBANToken__factory } from '@artifacts/typechain'
import { ethers, BigNumber } from 'ethers'
import SwapToBanRequest from '@/models/SwapToBanRequest'
import LoadBalancesFromContractRequest from '@/models/LoadBalancesFromContractRequest'

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
	private _wBanBalance: BigNumber = BigNumber.from(0)
	private _bnbDeposits: BigNumber = BigNumber.from(0)

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
	setWBANBalance(balance: BigNumber) {
		this._wBanBalance = balance
	}

	@Mutation
	setBNBDeposits(deposits: BigNumber) {
		this._bnbDeposits = deposits
	}

	@Action
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	async initContract(provider: any) {
		console.debug('in initContract')
		// const address = '0x6E3BC96EfBA650E89D56e94189c922BA07bfAcDD' // hardhat
		const address = '0x44033E98733398b8ADf9480f297A58de50e17dF7' // BSC testnet
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
	async loadBalances(request: LoadBalancesFromContractRequest) {
		const { contract, account } = request
		console.debug(`in loadBalances for account: ${account}`)
		const balance = await contract.balanceOf(account)
		console.info(`Balance is ${balance} wBAN`)
		this.context.commit('setWBANBalance', balance)
		const bnbDeposits = await contract.bnbBalanceOf(account)
		console.info(`BNB deposits ${ethers.utils.formatEther(bnbDeposits)} BNB`)
		this.context.commit('setBNBDeposits', bnbDeposits)
	}

	@Action
	async swap(swapRequest: SwapToBanRequest) {
		const { amount, toBanAddress, contract } = swapRequest
		console.log(`Should swap ${ethers.utils.formatEther(amount)} BAN to ${toBanAddress}`)
		const txn = await contract.swapToBan(toBanAddress, amount)
		await txn.wait()
	}
}

export default getModule(ContractsModule)
